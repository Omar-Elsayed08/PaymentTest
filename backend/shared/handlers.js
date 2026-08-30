import { validateCartItems, productCount } from "./catalog.js";
import { createCheckoutSession, getCheckoutSummary } from "./checkout-session.js";
import { HttpError } from "./http-error.js";

const MAX_IDEMPOTENCY_KEY = 255;

export async function createSession({ stripe, config, body, idempotencyKey }) {
    const lines = validateCartItems(body?.items, {
        maxCartLines: config.maxCartLines,
        maxQtyPerLine: config.maxQtyPerLine
    });

    const session = await createCheckoutSession({
        stripe,
        config,
        lines,
        idempotencyKey: idempotencyKey ? String(idempotencyKey).slice(0, MAX_IDEMPOTENCY_KEY) : ""
    });

    return { status: 200, body: { url: session.url, id: session.id } };
}

export async function readSession({ stripe, sessionId }) {
    const summary = await getCheckoutSummary({ stripe, sessionId });
    return { status: 200, body: summary };
}

/* Verifies the Stripe signature before trusting anything in the payload.
 * `cryptoProvider` is only needed on Workers, where verification must use
 * SubtleCrypto. */
export async function handleWebhook({ stripe, config, rawBody, signature, cryptoProvider, onOrder }) {
    if (!signature) {
        throw new HttpError(400, "Missing Stripe signature.");
    }

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            config.stripeWebhookSecret,
            undefined,
            cryptoProvider
        );
    } catch (err) {
        throw new HttpError(400, "Invalid Stripe signature.");
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await onOrder?.({
            receivedAt: new Date().toISOString(),
            eventId: event.id,
            sessionId: session.id,
            paid: session.payment_status === "paid",
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_details?.email || "",
            shipping: session.collected_information?.shipping_details
                || session.shipping_details
                || null,
            cart: session.metadata?.cart || ""
        });
    }

    return { status: 200, body: { received: true } };
}

export function health() {
    return { status: 200, body: { ok: true, products: productCount() } };
}
