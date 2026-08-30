import { PRODUCTS } from "./catalog-data.js";
import { HttpError } from "./http-error.js";

const BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));

export function getProduct(id) {
    return BY_ID.get(id) || null;
}

export function productCount() {
    return BY_ID.size;
}

export function variantKey(colorId, materialId) {
    return (colorId || "") + "::" + (materialId || "");
}

/* Picks the option a cart line refers to.
 *
 * An empty id means the line was saved before the option existed, which the
 * shop resolves to the first option, so the same fallback happens here. An id
 * that is not empty but also not in the catalog is refused instead of being
 * silently repriced. */
function resolveOption(product, options, requestedId, defaultId, kind) {
    const requested = String(requestedId || "");

    if (!options.length) {
        if (requested) {
            throw new HttpError(400, `${product.title} does not come in different ${kind}s.`);
        }
        return null;
    }

    if (!requested) {
        return options.find((option) => option.id === defaultId) || options[0];
    }

    const match = options.find((option) => option.id === requested);
    if (!match) {
        throw new HttpError(
            400,
            `${product.title} is no longer offered in that ${kind}. Remove it from your cart and choose again.`
        );
    }
    return match;
}

function resolveSize(product, rawSize) {
    const size = String(rawSize || "");
    if (product.sizes.length && !product.sizes.includes(size)) {
        throw new HttpError(400, `${product.title} needs a valid size.`);
    }
    if (!product.sizes.length && size) {
        throw new HttpError(400, `${product.title} does not use sizes.`);
    }
    return size;
}

function resolveQty(product, rawQty, maxQtyPerLine) {
    const qty = Number.parseInt(rawQty, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > maxQtyPerLine) {
        throw new HttpError(400, `Invalid quantity for ${product.title}.`);
    }
    return qty;
}

/* Turns one untrusted cart line into a priced line.
 *
 * The price comes from the variant recorded in PRODUCTS, so a colorway that
 * costs more, or a material that replaces the base price, is charged correctly
 * no matter what the browser claims the total was. */
export function resolveLine(line, limits) {
    if (!line || typeof line !== "object") {
        throw new HttpError(400, "Invalid cart line.");
    }

    const product = getProduct(String(line.id || ""));
    if (!product) {
        throw new HttpError(400, "Unknown product in cart.");
    }

    const size = resolveSize(product, line.size);
    const qty = resolveQty(product, line.qty, limits.maxQtyPerLine);
    const color = resolveOption(product, product.colors, line.color, product.defaultColorId, "color");
    const material = resolveOption(
        product,
        product.materials,
        line.material,
        product.defaultMaterialId,
        "material"
    );

    const key = variantKey(color ? color.id : "", material ? material.id : "");
    const variant = product.variants[key];
    if (!variant) {
        throw new HttpError(
            400,
            `${product.title} is not available in that combination. Remove it from your cart and choose again.`
        );
    }

    return {
        product,
        size,
        qty,
        colorId: color ? color.id : "",
        colorLabel: color ? color.label : "",
        materialId: material ? material.id : "",
        materialLabel: material ? material.label : "",
        priceCents: variant.priceCents,
        imagePath: variant.imagePath || ""
    };
}

/* Prices always come from PRODUCTS, never from the request, so editing the
 * page in devtools cannot change what is charged. */
export function validateCartItems(items, limits) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new HttpError(400, "Your cart is empty.");
    }
    if (items.length > limits.maxCartLines) {
        throw new HttpError(400, "Too many items in this checkout.");
    }

    return items.map((line) => resolveLine(line, limits));
}
