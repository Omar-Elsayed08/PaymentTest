(function () {
    "use strict";

    var STORAGE_KEY = "eb_cart";
    var CHANGE_EVENT = "eb-cart-change";

    /* A line is unique per id + size + color + material. */
    function lineKey(id, size, color, material) {
        return [id, size || "", color || "", material || ""].join("::");
    }

    function keyOf(line) {
        return lineKey(line.id, line.size, line.color, line.material);
    }

    function optionsKey(id, size, options) {
        options = options || {};
        return lineKey(id, size, options.color, options.material);
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

    function formatPrice(cents) {
        return "$" + (Math.round(cents) / 100).toFixed(2);
    }

    /* ----- public API ----- */

    function getCart() {
        return readRaw();
    }

    /* Returns cart lines enriched with catalog data, skipping items whose id no
     * longer exists in SHOP_DATA. Variant pricing and imagery come from the
     * shared resolver, so legacy lines saved before colors/materials existed
     * still resolve to the item's defaults. */
    function getDetailedCart() {
        var data = window.SHOP_DATA;
        return readRaw().map(function (line) {
            var item = data && data.getItem ? data.getItem(line.id) : null;
            if (!item) {
                return null;
            }
            var variant = data.resolveVariant(item, {
                color: line.color,
                material: line.material
            });
            return {
                key: keyOf(line),
                id: line.id,
                size: line.size || "",
                color: variant.colorId,
                material: variant.materialId,
                colorLabel: variant.colorLabel,
                materialLabel: variant.materialLabel,
                variantLabel: data.describeVariant(variant),
                qty: line.qty,
                title: item.title,
                image: variant.images[0] || (item.images && item.images[0]) || "",
                swatch: item.swatch || "blue",
                priceCents: variant.priceCents,
                lineTotalCents: variant.priceCents * line.qty
            };
        }).filter(Boolean);
    }

    function addItem(id, size, qty, options) {
        options = options || {};
        qty = Math.max(1, parseInt(qty, 10) || 1);
        var lines = readRaw();
        var key = optionsKey(id, size, options);
        var existing = lines.find(function (line) {
            return keyOf(line) === key;
        });
        if (existing) {
            existing.qty += qty;
        } else {
            lines.push({
                id: id,
                size: size || "",
                color: options.color || "",
                material: options.material || "",
                qty: qty
            });
        }
        writeRaw(lines);
    }

    function updateQty(id, size, qty, options) {
        qty = parseInt(qty, 10) || 0;
        var key = optionsKey(id, size, options);
        var lines = readRaw().filter(function (line) {
            if (keyOf(line) !== key) {
                return true;
            }
            line.qty = qty;
            return qty > 0;
        });
        writeRaw(lines);
    }

    function removeItem(id, size, options) {
        var key = optionsKey(id, size, options);
        var lines = readRaw().filter(function (line) {
            return keyOf(line) !== key;
        });
        writeRaw(lines);
    }

    /* Key-based mutators: the key on a detailed line always matches its stored
     * row, even for rows saved before variants existed. */
    function updateQtyByKey(key, qty) {
        qty = parseInt(qty, 10) || 0;
        var lines = readRaw().filter(function (line) {
            if (keyOf(line) !== key) {
                return true;
            }
            line.qty = qty;
            return qty > 0;
        });
        writeRaw(lines);
    }

    function removeByKey(key) {
        var lines = readRaw().filter(function (line) {
            return keyOf(line) !== key;
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
                    color: line.color,
                    material: line.material,
                    qty: line.qty,
                    priceCents: line.priceCents
                };
            }),
            subtotalCents: getSubtotalCents(),
            currency: "USD"
        };
    }

    function checkout() {
        if (!window.EBCheckout || typeof window.EBCheckout.start !== "function") {
            return Promise.reject(new Error("Checkout is not loaded."));
        }
        return window.EBCheckout.start(buildCheckoutPayload());
    }

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
        updateQtyByKey: updateQtyByKey,
        removeByKey: removeByKey,
        clear: clear,
        getCount: getCount,
        getSubtotalCents: getSubtotalCents,
        formatPrice: formatPrice,
        buildCheckoutPayload: buildCheckoutPayload,
        checkout: checkout,
        onChange: onChange
    };
})();
