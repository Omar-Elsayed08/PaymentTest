(function () {
    "use strict";

    /* Fallback chip colors so a color option can be declared with just a label. */
    var COLOR_FALLBACKS = {
        black: "#1a1a1a",
        white: "#ffffff",
        cream: "#ffe49f",
        natural: "#efe7d4",
        snow: "#f4f1e8",
        sand: "#d9c9a8",
        bone: "#eae4d6",
        blue: "#95d4f0",
        navy: "#1f2f52",
        orange: "#ff6031",
        red: "#c9312b",
        green: "#4f7a48",
        pink: "#f2a8bd",
        purple: "#6f4b9b",
        grey: "#9a9a9a",
        gray: "#9a9a9a",
        brown: "#6b4a2f",
        yellow: "#f5c749"
    };

    function withCategory(items, category) {
        return (items || []).map(function (item) {
            return Object.assign({}, item, { category: category });
        });
    }

    function toNumber(value, fallback) {
        var num = Number(value);
        return isFinite(num) ? num : fallback;
    }

    function slugify(value, fallback) {
        var slug = String(value == null ? "" : value)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return slug || fallback;
    }

    function isPlainObject(value) {
        return !!value && typeof value === "object" && !Array.isArray(value);
    }

    /* Reads an images map keyed by material id, e.g.
     *   { "snow-washed": [...], "essential-cotton": [...] }
     * A map with no entry for the material falls back to its "default" key. */
    function imagesForMaterial(map, materialId) {
        if (!isPlainObject(map)) {
            return [];
        }
        var list = materialId && map[materialId] !== undefined ? map[materialId] : map["default"];
        return cleanImages(list);
    }

    /* Every page that reads the catalog sits at a different depth, so image
     * paths are authored from the site root and re-prefixed per page. Running
     * this on an already-prefixed path yields the same result. */
    var cachedPrefix = null;

    function assetPrefix() {
        if (cachedPrefix !== null) {
            return cachedPrefix;
        }
        var path = (window.location && window.location.pathname) || "";
        var segments = path.split("/").filter(Boolean);
        if (segments.length && /\.[a-z0-9]+$/i.test(segments[segments.length - 1])) {
            segments.pop();
        }
        var shopIndex = segments.lastIndexOf("shop");
        var depth = shopIndex === -1 ? 0 : segments.length - shopIndex;
        cachedPrefix = new Array(depth + 1).join("../");
        return cachedPrefix;
    }

    function resolveAsset(path) {
        if (!path || typeof path !== "string") {
            return "";
        }
        if (/^([a-z]+:)?\/\//i.test(path) || path.charAt(0) === "/" || path.indexOf("data:") === 0) {
            return path;
        }
        return assetPrefix() + path.replace(/^(\.{1,2}\/)+/, "");
    }

    function cleanImages(list) {
        return (Array.isArray(list) ? list : []).filter(Boolean).map(resolveAsset);
    }

    function resolveHex(raw, label) {
        if (raw && typeof raw === "string") {
            return raw;
        }
        var words = String(label || "").toLowerCase().split(/[^a-z]+/).filter(Boolean);
        for (var i = words.length - 1; i >= 0; i -= 1) {
            if (COLOR_FALLBACKS[words[i]]) {
                return COLOR_FALLBACKS[words[i]];
            }
        }
        return "#efe7d4";
    }

    function normalizeColor(raw, index) {
        var source = raw || {};
        var label = source.label || source.name || source.id || "Color " + (index + 1);
        return {
            id: slugify(source.id || label, "color-" + (index + 1)),
            label: label,
            hex: resolveHex(source.hex || source.color, label),
            images: cleanImages(source.images),
            imagesByMaterial: source.imagesByMaterial || null,
            priceDelta: toNumber(source.priceDelta, 0)
        };
    }

    function normalizeMaterial(raw, index) {
        var source = raw || {};
        var label = source.label || source.name || source.id || "Material " + (index + 1);
        return {
            id: slugify(source.id || label, "material-" + (index + 1)),
            label: label,
            note: source.note || "",
            price: source.price == null ? null : toNumber(source.price, null),
            priceDelta: toNumber(source.priceDelta, 0)
        };
    }

    /* Ids identify an option in the cart, so repeats in the data get a numbered
     * suffix instead of collapsing into one another. */
    function withUniqueIds(options) {
        var seen = {};
        return options.map(function (option) {
            var id = option.id;
            seen[id] = (seen[id] || 0) + 1;
            if (seen[id] > 1) {
                option.id = id + "-" + seen[id];
            }
            return option;
        });
    }

    /* Returns [] when the item declares no colors, so callers can hide the control. */
    function getColorOptions(item) {
        if (!item || !Array.isArray(item.colors)) {
            return [];
        }
        return withUniqueIds(item.colors.filter(Boolean).map(normalizeColor));
    }

    function getMaterialOptions(item) {
        if (!item || !Array.isArray(item.materials)) {
            return [];
        }
        return withUniqueIds(item.materials.filter(Boolean).map(normalizeMaterial));
    }

    function findOption(options, id) {
        if (!options.length) {
            return null;
        }
        var match = options.find(function (option) {
            return option.id === id;
        });
        return match || options[0];
    }

    function findExactOption(options, id) {
        return options.find(function (option) {
            return option.id === id;
        }) || null;
    }

    /* Image precedence, most specific first:
     *   1. color.imagesByMaterial[materialId]
     *   2. color.images
     *   3. item.imagesByMaterial[materialId]
     *   4. item.images */
    function resolveImages(item, color, material) {
        var materialId = material ? material.id : "";

        if (color) {
            var colorByMaterial = imagesForMaterial(color.imagesByMaterial, materialId);
            if (colorByMaterial.length) {
                return colorByMaterial;
            }
            if (color.images.length) {
                return color.images;
            }
        }

        var itemByMaterial = imagesForMaterial(item && item.imagesByMaterial, materialId);
        if (itemByMaterial.length) {
            return itemByMaterial;
        }

        return cleanImages(item && item.images);
    }

    /* A colorway that lists its images per material only exists in the materials
     * it names, so a missing entry means the pair is not for sale rather than a
     * reason to fall back to another colorway's renders. */
    function hasImages(item, color, material) {
        if (color && isPlainObject(color.imagesByMaterial)) {
            return imagesForMaterial(color.imagesByMaterial, material ? material.id : "").length > 0;
        }
        return resolveImages(item, color, material).length > 0;
    }

    function isVariantAvailable(item, selection) {
        selection = selection || {};
        var color = findExactOption(getColorOptions(item), selection.color);
        var material = findExactOption(getMaterialOptions(item), selection.material);
        return hasImages(item, color, material);
    }

    /* Price rule: a material may replace the base price, then both the material
     * and the color deltas are added on top. */
    function resolveVariant(item, selection) {
        selection = selection || {};

        var colors = getColorOptions(item);
        var materials = getMaterialOptions(item);
        var color = findOption(colors, selection.color);
        var material = findOption(materials, selection.material);

        var price = material && material.price != null
            ? material.price
            : toNumber(item && item.price, 0);
        if (material) {
            price += material.priceDelta;
        }
        if (color) {
            price += color.priceDelta;
        }
        price = Math.max(0, price);

        return {
            color: color,
            material: material,
            colorId: color ? color.id : "",
            colorLabel: color ? color.label : "",
            materialId: material ? material.id : "",
            materialLabel: material ? material.label : "",
            images: resolveImages(item, color, material),
            price: price,
            priceCents: Math.round(price * 100)
        };
    }

    /* "black / essential cotton" — shared by the cart rows and status messages. */
    function describeVariant(variant) {
        if (!variant) {
            return "";
        }
        return [variant.colorLabel, variant.materialLabel].filter(Boolean).join(" / ");
    }

    window.SHOP_DATA = {
        items: [].concat(
            withCategory(window.SHOP_SHIRTS, "shirts"),
            withCategory(window.SHOP_PRINTS, "prints"),
            withCategory(window.SHOP_MORE, "more")
        ),
        resolveAsset: resolveAsset,
        getColorOptions: getColorOptions,
        getMaterialOptions: getMaterialOptions,
        isVariantAvailable: isVariantAvailable,
        resolveVariant: resolveVariant,
        describeVariant: describeVariant
    };

    window.SHOP_DATA.getItem = function (id) {
        return window.SHOP_DATA.items.find(function (item) {
            return item.id === id;
        }) || null;
    };

    /* The default variant's images back the grid tiles and cart thumbnails. */
    window.SHOP_DATA.getImages = function (item) {
        return resolveVariant(item, {}).images;
    };
})();
