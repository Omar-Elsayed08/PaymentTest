(function () {
    "use strict";

    var CHECKOUT_PATH = "/api/checkout/session";

    function apiOrigin() {
        if (window.EB_CHECKOUT_ORIGIN) {
            return String(window.EB_CHECKOUT_ORIGIN).replace(/\/+$/, "");
        }
        return "";
    }

    function checkoutUrl() {
        return apiOrigin() + CHECKOUT_PATH;
    }

    function sessionUrl(id) {
        return apiOrigin() + CHECKOUT_PATH + "/" + encodeURIComponent(id);
    }

    function makeIdempotencyKey() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }
        return "eb_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }

    function readError(payload, fallback) {
        if (payload && typeof payload.error === "string" && payload.error) {
            return payload.error;
        }
        return fallback;
    }

    /* Only identifiers and quantities are sent; prices are looked up
     * server-side from the catalog. */
    function toSafeItems(payload) {
        var source = payload && Array.isArray(payload.items) ? payload.items : [];
        return source.map(function (line) {
            return {
                id: line.id,
                size: line.size || "",
                color: line.color || "",
                material: line.material || "",
                qty: line.qty
            };
        });
    }

    function parseJson(res) {
        return res.text().then(function (text) {
            if (!text) {
                return {};
            }
            try {
                return JSON.parse(text);
            } catch (err) {
                return {};
            }
        });
    }

    function start(payload) {
        var items = toSafeItems(payload);
        if (!items.length) {
            return Promise.reject(new Error("Your cart is empty."));
        }

        return fetch(checkoutUrl(), {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Idempotency-Key": makeIdempotencyKey()
            },
            body: JSON.stringify({ items: items })
        }).then(function (res) {
            return parseJson(res).then(function (body) {
                if (!res.ok) {
                    throw new Error(readError(body, "Checkout could not be started."));
                }
                if (!body.url) {
                    throw new Error("Checkout did not return a payment URL.");
                }
                window.location.assign(body.url);
                return body;
            });
        }).catch(function (err) {
            if (err && err.name === "TypeError") {
                throw new Error("Could not reach the checkout server. Start the shop with npm start.");
            }
            throw err;
        });
    }

    function getSession(sessionId) {
        if (!sessionId) {
            return Promise.reject(new Error("Missing checkout session."));
        }
        return fetch(sessionUrl(sessionId), {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        }).then(function (res) {
            return parseJson(res).then(function (body) {
                if (!res.ok) {
                    throw new Error(readError(body, "Could not confirm payment."));
                }
                return body;
            });
        });
    }

    window.EBCheckout = {
        start: start,
        getSession: getSession
    };
})();
