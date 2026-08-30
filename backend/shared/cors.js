const ALLOW_METHODS = "GET, POST, OPTIONS";
const ALLOW_HEADERS = "Content-Type, Accept, Idempotency-Key";

/* Headers that let an allowed front end on another host call the API, or null
 * when the request is same-origin or the origin is not on the allowlist.
 *
 * Credentials are never allowed: checkout carries no cookies, so there is
 * nothing for another site to abuse by calling this. */
export function corsHeaders(origin, config) {
    const allowed = (config && config.allowedOrigins) || [];
    const cleaned = String(origin || "").replace(/\/+$/, "");
    if (!cleaned || !allowed.includes(cleaned)) {
        return null;
    }
    return {
        "access-control-allow-origin": cleaned,
        "access-control-allow-methods": ALLOW_METHODS,
        "access-control-allow-headers": ALLOW_HEADERS,
        "access-control-max-age": "86400",
        vary: "Origin"
    };
}
