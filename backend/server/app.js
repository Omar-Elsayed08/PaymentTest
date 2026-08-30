import fs from "node:fs";
import path from "node:path";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { corsHeaders } from "../shared/cors.js";
import { toErrorResponse } from "../shared/http-error.js";
import { createSession, readSession, handleWebhook, health } from "../shared/handlers.js";

/* Local mirror of the Worker. Same shared handlers, Express plumbing. */

const BLOCKED_PATHS = [
    /^\/backend(?:\/|$)/i,
    /^\/node_modules(?:\/|$)/i,
    /^\/\.git(?:\/|$)/i,
    /^\/\.env/i,
    /^\/package(?:-lock)?\.json$/i,
    /^\/wrangler\.toml$/i
];

function send(res, result) {
    res.status(result.status).json(result.body);
}

function fail(res, err) {
    const { status, body } = toErrorResponse(err);
    if (status >= 500) {
        console.error("api error", err?.stack || err);
    }
    res.status(status).json(body);
}

function appendOrderLog(rootDir, record) {
    const dir = path.join(rootDir, "backend", "server", "var");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, "orders.jsonl"), JSON.stringify(record) + "\n", "utf8");
}

export function createApp(config, rootDir) {
    const app = express();
    const stripe = new Stripe(config.stripeSecretKey, { maxNetworkRetries: 2, timeout: 20000 });

    app.disable("x-powered-by");
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

    /* Mirrors the Worker so a front end on another host behaves the same in
     * both runtimes. Without ALLOWED_ORIGINS this does nothing. */
    app.use("/api", (req, res, next) => {
        const cors = corsHeaders(req.get("origin"), config);
        if (cors) {
            res.set(cors);
        }
        if (req.method !== "OPTIONS") {
            next();
            return;
        }
        if (cors) {
            res.status(204).end();
        } else {
            res.status(403).json({ error: "Origin not allowed." });
        }
    });

    /* Signature verification needs the unparsed body, so this precedes json(). */
    app.post(
        "/api/webhooks/stripe",
        express.raw({ type: "application/json" }),
        async (req, res) => {
            try {
                send(res, await handleWebhook({
                    stripe,
                    config,
                    rawBody: req.body,
                    signature: req.get("stripe-signature"),
                    onOrder: (record) => appendOrderLog(rootDir, record)
                }));
            } catch (err) {
                fail(res, err);
            }
        }
    );

    app.use(express.json({ limit: "24kb" }));

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many checkout attempts. Please wait and try again." }
    });

    app.post("/api/checkout/session", limiter, async (req, res) => {
        try {
            send(res, await createSession({
                stripe,
                config,
                body: req.body,
                idempotencyKey: req.get("idempotency-key")
            }));
        } catch (err) {
            fail(res, err);
        }
    });

    app.get("/api/checkout/session/:id", async (req, res) => {
        try {
            send(res, await readSession({ stripe, sessionId: req.params.id }));
        } catch (err) {
            fail(res, err);
        }
    });

    app.get("/api/health", (_req, res) => send(res, health()));

    app.use((req, res, next) => {
        if (BLOCKED_PATHS.some((pattern) => pattern.test(req.path))) {
            res.status(404).end();
            return;
        }
        next();
    });

    app.use(express.static(rootDir, { extensions: ["html"], index: "index.html" }));

    return app;
}
