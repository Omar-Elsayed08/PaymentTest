import { PRODUCTS } from "./catalog-data.js";
import { HttpError } from "./http-error.js";

const BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));

export function getProduct(id) {
    return BY_ID.get(id) || null;
}

export function productCount() {
    return BY_ID.size;
}

/* Mirrors the front end's findOption: an unknown or empty option id falls
 * back to the first option, so carts saved before variants existed still
 * resolve. */
function pickOptionId(ids, requested) {
    if (!ids.length) {
        return "";
    }
    return ids.includes(requested) ? requested : ids[0];
}

/* Turns an untrusted cart from the browser into priced lines.
 *
 * Prices always come from PRODUCTS, never from the request, so editing the
 * page in devtools cannot change what is charged. Variant prices likewise
 * come from the generated catalog, keyed by color/material ids only. */
export function validateCartItems(items, limits) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new HttpError(400, "Your cart is empty.");
    }
    if (items.length > limits.maxCartLines) {
        throw new HttpError(400, "Too many items in this checkout.");
    }

    return items.map((line) => {
        if (!line || typeof line !== "object") {
            throw new HttpError(400, "Invalid cart line.");
        }

        const product = getProduct(String(line.id || ""));
        if (!product) {
            throw new HttpError(400, "Unknown product in cart.");
        }

        const size = String(line.size || "");
        if (product.sizes.length && !product.sizes.includes(size)) {
            throw new HttpError(400, `${product.title} needs a valid size.`);
        }
        if (!product.sizes.length && size) {
            throw new HttpError(400, `${product.title} does not use sizes.`);
        }

        const qty = Number.parseInt(line.qty, 10);
        if (!Number.isInteger(qty) || qty < 1 || qty > limits.maxQtyPerLine) {
            throw new HttpError(400, `Invalid quantity for ${product.title}.`);
        }

        let variant = null;
        if (product.variants.length) {
            const colorId = pickOptionId(product.colorIds, String(line.color || ""));
            const materialId = pickOptionId(product.materialIds, String(line.material || ""));
            variant = product.variants.find(
                (candidate) => candidate.color === colorId && candidate.material === materialId
            ) || null;
            if (!variant) {
                throw new HttpError(400, `${product.title} is not available in that combination.`);
            }
        }

        return { product, size, qty, variant };
    });
}
