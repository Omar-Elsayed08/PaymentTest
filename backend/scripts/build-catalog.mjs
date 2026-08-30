/* Reads the browser product files in shop/ and emits backend/shared/catalog-data.js.
 *
 * The shop/**-data.js files stay the single place products are edited. They
 * assign to `window`, which does not exist on Cloudflare Workers, so this
 * script flattens them into a plain module both runtimes can import.
 *
 * Shirts declare colors and materials (see shop/shirts/shirts-catalog.js) that
 * change the price, so every available color+material pair is priced here at
 * build time. The normalization below mirrors shop/js/shop-data.js: a pair is
 * for sale exactly when the front end can show renders for it, and its price
 * is (material.price ?? item.price) + material.priceDelta + color.priceDelta.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(backendDir, "..");
const outFile = path.join(backendDir, "shared", "catalog-data.js");

/* `deps` run in the same sandbox before the data file, for files that build
 * their products with shared helpers. */
const SOURCES = [
    {
        file: "shop/shirts/shirts-data.js",
        deps: ["shop/shirts/shirts-catalog.js"],
        global: "SHOP_SHIRTS",
        category: "shirts"
    },
    { file: "shop/prints/prints-data.js", global: "SHOP_PRINTS", category: "prints" },
    { file: "shop/more/more-data.js", global: "SHOP_MORE", category: "more" }
];

function readGlobalArray(source) {
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    for (const file of [...(source.deps || []), source.file]) {
        const absPath = path.join(rootDir, file);
        vm.runInContext(fs.readFileSync(absPath, "utf8"), sandbox, {
            filename: absPath,
            timeout: 2000
        });
    }
    const items = sandbox.window[source.global];
    if (!Array.isArray(items)) {
        throw new Error(`${source.file} did not define window.${source.global}`);
    }
    return items;
}

function toCents(price, id) {
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Product "${id}" has an invalid price: ${price}`);
    }
    return Math.round(amount * 100);
}

function toNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function slugify(value, fallback) {
    const slug = String(value == null ? "" : value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || fallback;
}

function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

/* Image paths are authored from the site root ("assets/…") or relative to a
 * shop page ("../../assets/…"); both mean the same file. Site-absolute paths
 * turn into URLs anywhere. */
function toSitePath(imagePath) {
    if (!imagePath || typeof imagePath !== "string") {
        return "";
    }
    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }
    return "/" + imagePath.replace(/^(\.{1,2}\/)+/, "");
}

function cleanImages(list) {
    return (Array.isArray(list) ? list : []).filter(Boolean).map(toSitePath);
}

/* Reads an images map keyed by material id, falling back to its "default" key. */
function imagesForMaterial(map, materialId) {
    if (!isPlainObject(map)) {
        return [];
    }
    const list = materialId && map[materialId] !== undefined ? map[materialId] : map["default"];
    return cleanImages(list);
}

function normalizeColor(raw, index) {
    const source = raw || {};
    const label = source.label || source.name || source.id || "Color " + (index + 1);
    return {
        id: slugify(source.id || label, "color-" + (index + 1)),
        label,
        images: cleanImages(source.images),
        imagesByMaterial: isPlainObject(source.imagesByMaterial) ? source.imagesByMaterial : null,
        priceDelta: toNumber(source.priceDelta, 0)
    };
}

function normalizeMaterial(raw, index) {
    const source = raw || {};
    const label = source.label || source.name || source.id || "Material " + (index + 1);
    return {
        id: slugify(source.id || label, "material-" + (index + 1)),
        label,
        price: source.price == null ? null : toNumber(source.price, null),
        priceDelta: toNumber(source.priceDelta, 0)
    };
}

function withUniqueIds(options) {
    const seen = {};
    return options.map((option) => {
        seen[option.id] = (seen[option.id] || 0) + 1;
        if (seen[option.id] > 1) {
            option.id = option.id + "-" + seen[option.id];
        }
        return option;
    });
}

/* Image precedence, most specific first:
 *   1. color.imagesByMaterial[materialId]
 *   2. color.images
 *   3. item.imagesByMaterial[materialId]
 *   4. item.images */
function resolveImages(item, color, material) {
    const materialId = material ? material.id : "";

    if (color) {
        const colorByMaterial = imagesForMaterial(color.imagesByMaterial, materialId);
        if (colorByMaterial.length) {
            return colorByMaterial;
        }
        if (color.images.length) {
            return color.images;
        }
    }

    const itemByMaterial = imagesForMaterial(item && item.imagesByMaterial, materialId);
    if (itemByMaterial.length) {
        return itemByMaterial;
    }

    return cleanImages(item && item.images);
}

/* A colorway that lists its images per material only exists in the materials
 * it names, so a missing entry means the pair is not for sale. */
function pairAvailable(item, color, material) {
    if (color && isPlainObject(color.imagesByMaterial)) {
        return imagesForMaterial(color.imagesByMaterial, material ? material.id : "").length > 0;
    }
    return resolveImages(item, color, material).length > 0;
}

function buildVariants(raw) {
    const colors = withUniqueIds((Array.isArray(raw.colors) ? raw.colors : []).filter(Boolean).map(normalizeColor));
    const materials = withUniqueIds((Array.isArray(raw.materials) ? raw.materials : []).filter(Boolean).map(normalizeMaterial));

    const variants = [];
    if (colors.length || materials.length) {
        const colorList = colors.length ? colors : [null];
        const materialList = materials.length ? materials : [null];

        for (const color of colorList) {
            for (const material of materialList) {
                if (!pairAvailable(raw, color, material)) {
                    continue;
                }
                let price = material && material.price != null ? material.price : toNumber(raw.price, 0);
                if (material) {
                    price += material.priceDelta;
                }
                if (color) {
                    price += color.priceDelta;
                }
                price = Math.max(0, price);

                variants.push({
                    color: color ? color.id : "",
                    colorLabel: color ? color.label : "",
                    material: material ? material.id : "",
                    materialLabel: material ? material.label : "",
                    priceCents: Math.round(price * 100),
                    imagePath: resolveImages(raw, color, material)[0] || ""
                });
            }
        }

        if (!variants.length) {
            throw new Error(`Product "${raw.id}" declares options but no available color/material pair`);
        }
    }

    return {
        colorIds: colors.map((color) => color.id),
        materialIds: materials.map((material) => material.id),
        variants
    };
}

const products = [];
const seen = new Set();

for (const source of SOURCES) {
    for (const raw of readGlobalArray(source)) {
        if (!raw || typeof raw.id !== "string" || !raw.id) {
            throw new Error(`${source.file} contains a product with no id`);
        }
        if (seen.has(raw.id)) {
            throw new Error(`Duplicate product id: ${raw.id}`);
        }
        seen.add(raw.id);

        const { colorIds, materialIds, variants } = buildVariants(raw);

        products.push({
            id: raw.id,
            title: String(raw.title || raw.id),
            category: source.category,
            priceCents: toCents(raw.price, raw.id),
            sizes: Array.isArray(raw.sizes) ? raw.sizes.map(String) : [],
            imagePath: variants.length ? variants[0].imagePath : cleanImages(raw.images)[0] || "",
            colorIds,
            materialIds,
            variants
        });
    }
}

const banner = "/* Generated by backend/scripts/build-catalog.mjs. Edit shop/**-data.js instead. */\n\n";
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, banner + "export const PRODUCTS = " + JSON.stringify(products, null, 4) + ";\n", "utf8");

const variantCount = products.reduce((sum, product) => sum + product.variants.length, 0);
console.log(`Wrote ${products.length} products (${variantCount} variants) to backend/shared/catalog-data.js`);
