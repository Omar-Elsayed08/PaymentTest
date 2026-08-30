/* Reads the browser product files in shop/ and emits backend/shared/catalog-data.js.
 *
 * The shop/**-data.js files stay the single place products are edited. They
 * assign to `window`, which does not exist on Cloudflare Workers, so this
 * script runs them in a sandbox and flattens the result into a plain module
 * both runtimes can import.
 *
 * shop/js/shop-data.js is loaded too, because it owns the variant rules: which
 * color and material pairs exist, and what each one costs. Reusing it here is
 * what keeps the price Stripe charges identical to the price on the page. */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(backendDir, "..");
const outFile = path.join(backendDir, "shared", "catalog-data.js");

/* Load order matters: shirts-catalog.js defines the helpers shirts-data.js
 * calls, and shop-data.js reads all three product globals. */
const SOURCES = [
    "shop/shirts/shirts-catalog.js",
    "shop/shirts/shirts-data.js",
    "shop/prints/prints-data.js",
    "shop/more/more-data.js",
    "shop/js/shop-data.js"
];

const warnings = [];

/* shop-data.js derives an image path prefix from the current URL so each page
 * can sit at a different depth. A pathname of "/" makes that prefix empty,
 * which leaves image paths as authored from the site root. */
function loadShopData() {
    const sandbox = { window: { location: { pathname: "/" } }, console };
    vm.createContext(sandbox);

    for (const source of SOURCES) {
        const absPath = path.join(rootDir, source);
        vm.runInContext(fs.readFileSync(absPath, "utf8"), sandbox, {
            filename: absPath,
            timeout: 10000
        });
    }

    const data = sandbox.window.SHOP_DATA;
    if (!data || !Array.isArray(data.items)) {
        throw new Error("shop/js/shop-data.js did not define window.SHOP_DATA.items");
    }
    return data;
}

/* Image paths arrive site-relative ("assets/x.png"). Stripe needs an absolute
 * URL, so they are stored site-absolute and prefixed with the origin later. */
function toSitePath(imagePath) {
    if (!imagePath || typeof imagePath !== "string") {
        return "";
    }
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith("/")) {
        return imagePath;
    }
    return "/" + imagePath.replace(/^(\.{1,2}\/)+/, "");
}

function toCents(variant, id) {
    const cents = Number(variant.priceCents);
    if (!Number.isInteger(cents) || cents < 0) {
        throw new Error(`Product "${id}" resolved to an invalid price: ${variant.price}`);
    }
    return cents;
}

function optionSummary(options) {
    return options.map((option) => ({ id: option.id, label: option.label }));
}

/* Expands one item into every color/material pair a shopper can actually buy.
 *
 * A colorway that names its images per material only exists in the materials it
 * names, and shop-data.js already encodes that as isVariantAvailable, so the
 * same test decides what the server will sell. Items with no options at all are
 * exempt: a print with no photo yet is still a real product. */
function buildVariants(data, item, colors, materials) {
    const hasOptions = colors.length > 0 || materials.length > 0;
    const colorIds = colors.length ? colors.map((color) => color.id) : [""];
    const materialIds = materials.length ? materials.map((material) => material.id) : [""];
    const variants = {};
    let count = 0;

    for (const colorId of colorIds) {
        for (const materialId of materialIds) {
            const selection = { color: colorId, material: materialId };
            if (hasOptions && !data.isVariantAvailable(item, selection)) {
                continue;
            }
            const variant = data.resolveVariant(item, selection);
            variants[colorId + "::" + materialId] = {
                priceCents: toCents(variant, item.id),
                imagePath: toSitePath(variant.images[0])
            };
            count += 1;
        }
    }

    /* Every pair being unavailable means the item has no images yet. The shop
     * still lists and sells it, so the default pair is kept priceable rather
     * than making checkout fail on an item the page accepted. */
    if (hasOptions && count === 0) {
        const fallback = data.resolveVariant(item, {});
        variants[fallback.colorId + "::" + fallback.materialId] = {
            priceCents: toCents(fallback, item.id),
            imagePath: toSitePath(fallback.images[0])
        };
        warnings.push(`${item.id}: no color/material pair has images, priced from its defaults`);
    }

    return variants;
}

const data = loadShopData();
const products = [];
const seen = new Set();

for (const item of data.items) {
    if (!item || typeof item.id !== "string" || !item.id) {
        throw new Error("shop/**-data.js contains a product with no id");
    }
    if (seen.has(item.id)) {
        throw new Error(`Duplicate product id: ${item.id}`);
    }
    seen.add(item.id);

    const colors = data.getColorOptions(item);
    const materials = data.getMaterialOptions(item);
    const defaults = data.resolveVariant(item, {});

    products.push({
        id: item.id,
        title: String(item.title || item.id),
        category: item.category || "",
        sizes: Array.isArray(item.sizes) ? item.sizes.map(String) : [],
        colors: optionSummary(colors),
        materials: optionSummary(materials),
        defaultColorId: defaults.colorId,
        defaultMaterialId: defaults.materialId,
        variants: buildVariants(data, item, colors, materials)
    });
}

const variantTotal = products.reduce(
    (total, product) => total + Object.keys(product.variants).length,
    0
);

const banner = "/* Generated by backend/scripts/build-catalog.mjs. Edit shop/**-data.js instead. */\n\n";
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(
    outFile,
    banner + "export const PRODUCTS = " + JSON.stringify(products, null, 4) + ";\n",
    "utf8"
);

for (const warning of warnings) {
    console.warn("warning: " + warning);
}
console.log(
    `Wrote ${products.length} products (${variantTotal} buyable variants) to backend/shared/catalog-data.js`
);
