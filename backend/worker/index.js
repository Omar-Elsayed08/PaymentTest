import Stripe from "stripe";
import { buildConfig } from "../shared/config.js";
import { corsHeaders } from "../shared/cors.js";
import { toErrorResponse } from "../shared/http-error.js";
import { createSession, readSession, handleWebhook, health } from "../shared/handlers.js";

const MAX_BODY_BYTES = 24 * 1024;

/* Workers have no Node http/crypto, so Stripe is pointed at fetch and
 * SubtleCrypto instead. */
function createStripe(secretKey) {
    return new Stripe(secretKey, {
        httpClient: Stripe.createFetchHttpClient(),
        maxNetworkRetries: 2
    });
}

let cryptoProvider;
function getCryptoProvider() {
    cryptoProvider = cryptoProvider || Stripe.createSubtleCryptoProvider();
    return cryptoProvider;
}

function json(status, body, cors) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...(cors || {})
        }
    });
}

async function readJsonBody(request) {
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_BODY_BYTES) {
        return null;
    }
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function logOrder(record) {
    /* Stripe's Dashboard is the durable record; this is for `wrangler tail`. */
    console.log("order", JSON.stringify(record));
}

async function route(request, config, url) {
    const stripe = createStripe(config.stripeSecretKey);
    const { pathname } = url;

    if (pathname === "/api/health" && request.method === "GET") {
        return health();
    }

    if (pathname === "/api/checkout/session" && request.method === "POST") {
        const body = await readJsonBody(request);
        return createSession({
            stripe,
            config,
            body,
            idempotencyKey: request.headers.get("idempotency-key") || ""
        });
    }

    if (pathname.startsWith("/api/checkout/session/") && request.method === "GET") {
        const sessionId = decodeURIComponent(pathname.slice("/api/checkout/session/".length));
        return readSession({ stripe, sessionId });
    }

    if (pathname === "/api/webhooks/stripe" && request.method === "POST") {
        return handleWebhook({
            stripe,
            config,
            rawBody: await request.text(),
            signature: request.headers.get("stripe-signature"),
            cryptoProvider: getCryptoProvider(),
            onOrder: logOrder
        });
    }

    return null;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (!url.pathname.startsWith("/api/")) {
            /* Assets are served by exact filename, so directory URLs like "/"
             * are mapped to their index page. */
            if (url.pathname.endsWith("/")) {
                return env.ASSETS.fetch(new Request(new URL(url.pathname + "index.html", url), request));
            }
            return env.ASSETS.fetch(request);
        }

        let cors = null;
        try {
            const config = buildConfig(env);
            cors = corsHeaders(request.headers.get("origin"), config);

            /* Preflight for a front end on an allowed different host. */
            if (request.method === "OPTIONS") {
                return cors
                    ? new Response(null, { status: 204, headers: cors })
                    : json(403, { error: "Origin not allowed." });
            }

            const result = await route(request, config, url);
            if (!result) {
                return json(404, { error: "Not found." }, cors);
            }
            return json(result.status, result.body, cors);
        } catch (err) {
            const { status, body } = toErrorResponse(err);
            if (status >= 500) {
                console.error("api error", err?.stack || String(err));
            }
            return json(status, body, cors);
        }
    }
};
