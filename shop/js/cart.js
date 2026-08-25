(function () {
    "use strict";

    var STORAGE_KEY = "eb_cart";
    var CHANGE_EVENT = "eb-cart-change";

    function lineKey(id, size) {
        return id + "::" + (size || "");
    }

    function readRaw() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed.filter(function (line) {
                return line && typeof line.id === "string" && typeof line.qty === "number" && line.qty > 0;
            });
        } catch (err) {
            return [];
        }
    }

    function writeRaw(lines) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
        } catch (err) {
            /* storage may be unavailable (private mode); fail quietly */
        }
        emitChange();
    }

    function emitChange() {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    }

    function toCents(price) {
        return Math.round((Number(price) || 0) * 100);
    }

    function formatPrice(cents) {
        return "$" + (Math.round(cents) / 100).toFixed(2);
    }

    /* ----- public API ----- */

    function getCart() {
        return readRaw();
    }

    /* Returns cart lines enriched with catalog data, skipping items whose id no
     * longer exists in SHOP_DATA. */
    function getDetailedCart() {
        var data = window.SHOP_DATA;
        return readRaw().map(function (line) {
            var item = data && data.getItem ? data.getItem(line.id) : null;
            if (!item) {
                return null;
            }
            var priceCents = toCents(item.price);
            return {
                id: line.id,
                size: line.size || "",
                qty: line.qty,
                title: item.title,
                image: (item.images && item.images[0]) || "",
                swatch: item.swatch || "blue",
                priceCents: priceCents,
                lineTotalCents: priceCents * line.qty
            };
        }).filter(Boolean);
    }

    function addItem(id, size, qty) {
        qty = Math.max(1, parseInt(qty, 10) || 1);
        var lines = readRaw();
        var key = lineKey(id, size);
        var existing = lines.find(function (line) {
            return lineKey(line.id, line.size) === key;
        });
        if (existing) {
            existing.qty += qty;
        } else {
            lines.push({ id: id, size: size || "", qty: qty });
        }
        writeRaw(lines);
    }

    function updateQty(id, size, qty) {
        qty = parseInt(qty, 10) || 0;
        var key = lineKey(id, size);
        var lines = readRaw().filter(function (line) {
            if (lineKey(line.id, line.size) !== key) {
                return true;
            }
            line.qty = qty;
            return qty > 0;
        });
        writeRaw(lines);
    }

    function removeItem(id, size) {
        var key = lineKey(id, size);
        var lines = readRaw().filter(function (line) {
            return lineKey(line.id, line.size) !== key;
        });
        writeRaw(lines);
    }

    function clear() {
        writeRaw([]);
    }

    function getCount() {
        return readRaw().reduce(function (sum, line) {
            return sum + line.qty;
        }, 0);
    }

    function getSubtotalCents() {
        return getDetailedCart().reduce(function (sum, line) {
            return sum + line.lineTotalCents;
        }, 0);
    }

    /* Assembles the payload a checkout API would consume. */
    function buildCheckoutPayload() {
        var lines = getDetailedCart();
        return {
            items: lines.map(function (line) {
                return {
                    id: line.id,
                    title: line.title,
                    size: line.size,
                    qty: line.qty,
                    priceCents: line.priceCents
                };
            }),
            subtotalCents: getSubtotalCents(),
            currency: "USD"
        };
    }

    /* Placeholder checkout. Swap the body for a real API call later, e.g.
     *   return fetch("/api/checkout", {
     *       method: "POST",
     *       headers: { "Content-Type": "application/json" },
     *       body: JSON.stringify(payload)
     *   }).then(function (res) { return res.json(); });
     */
    function checkout() {
        var payload = buildCheckoutPayload();
        // TODO: POST `payload` to the checkout API and redirect to the returned URL.
        console.log("[EBCart] checkout payload ready:", payload);
        return Promise.resolve(payload);
    }

    /* Subscribe to cart changes (same tab + other tabs). Returns an unsubscribe. */
    function onChange(callback) {
        function handler() {
            callback();
        }
        window.addEventListener(CHANGE_EVENT, handler);
        window.addEventListener("storage", function (event) {
            if (event.key === STORAGE_KEY) {
                handler();
            }
        });
        return function () {
            window.removeEventListener(CHANGE_EVENT, handler);
        };
    }

    window.EBCart = {
        getCart: getCart,
        getDetailedCart: getDetailedCart,
        addItem: addItem,
        updateQty: updateQty,
        removeItem: removeItem,
        clear: clear,
        getCount: getCount,
        getSubtotalCents: getSubtotalCents,
        formatPrice: formatPrice,
        buildCheckoutPayload: buildCheckoutPayload,
        checkout: checkout,
        onChange: onChange
    };
})();
