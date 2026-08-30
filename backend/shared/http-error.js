export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.expose = true;
    }
}

/* Maps any thrown value onto a status plus a message that is safe to show a
 * shopper. Stripe's own messages can leak account details, so they are
 * replaced rather than forwarded. */
export function toErrorResponse(err) {
    if (err && err.expose && err.status) {
        return { status: err.status, body: { error: err.message } };
    }

    if (err && err.type === "StripeAuthenticationError") {
        return {
            status: 503,
            body: { error: "Payments are not configured yet. Check STRIPE_SECRET_KEY." }
        };
    }

    if (err && err.type === "StripeCardError") {
        return { status: 402, body: { error: "That card was declined." } };
    }

    if (err && err.type === "StripeRateLimitError") {
        return { status: 429, body: { error: "Too busy right now. Please try again." } };
    }

    if (err && err.type === "StripeInvalidRequestError") {
        return { status: 400, body: { error: "Checkout could not be started." } };
    }

    if (err && err.type === "StripeConnectionError") {
        return { status: 502, body: { error: "Could not reach Stripe. Please try again." } };
    }

    return { status: 500, body: { error: "Something went wrong. Please try again." } };
}
