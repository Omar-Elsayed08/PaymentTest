const DEFAULTS = {
    currency: "usd",
    shippingCents: 800,
    maxQtyPerLine: 20,
    maxCartLines: 30,
    allowedShippingCountries: "US,CA"
};

function requireValue(source, name) {
    const value = source[name];
    if (!value || !String(value).trim()) {
        throw new Error("Missing required environment variable: " + name);
    }
    return String(value).trim();
}

function intValue(source, name, fallback) {
    const raw = source[name];
    if (raw == null || raw === "") {
        return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error("Invalid integer for " + name);
    }
    return parsed;
}

function countryList(raw) {
    return String(raw || DEFAULTS.allowedShippingCountries)
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean);
}

/* Origins allowed to call the API from a different host, for the setup where
 * the pages are served by GitHub Pages and only /api/ runs on Cloudflare. Empty
 * means same-origin only, which is what a Worker-hosted site wants. */
function originList(raw) {
    return String(raw || "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean);
}

/* Builds config from any key/value source: process.env locally, the Worker
 * env binding in production. */
export function buildConfig(source) {
    const baseUrl = String(source.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
    if (!baseUrl) {
        throw new Error("Missing required environment variable: PUBLIC_BASE_URL");
    }

    return {
        publicBaseUrl: baseUrl,
        stripeSecretKey: requireValue(source, "STRIPE_SECRET_KEY"),
        stripeWebhookSecret: requireValue(source, "STRIPE_WEBHOOK_SECRET"),
        currency: String(source.CURRENCY || DEFAULTS.currency).toLowerCase(),
        shippingCents: intValue(source, "SHIPPING_CENTS", DEFAULTS.shippingCents),
        maxQtyPerLine: intValue(source, "MAX_QTY_PER_LINE", DEFAULTS.maxQtyPerLine),
        maxCartLines: intValue(source, "MAX_CART_LINES", DEFAULTS.maxCartLines),
        allowedShippingCountries: countryList(source.ALLOWED_SHIPPING_COUNTRIES),
        allowedOrigins: originList(source.ALLOWED_ORIGINS)
    };
}
