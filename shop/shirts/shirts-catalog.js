(function () {
    "use strict";

    var SW = "assets/shop/mockups/oversized snow washed /";
    var EC = "assets/shop/mockups/essential cotton/";

    var MATERIALS = [
        { id: "snow-washed", label: "oversized snow washed", note: "heavyweight, boxy fit", priceDelta: 0 },
        { id: "essential-cotton", label: "essential cotton", note: "midweight, regular fit", priceDelta: 6 }
    ];

    var PALETTE = {
        snow: "#e7dacb",
        black: "#1d1d1d",
        pink: "#e4aba7",
        red: "#d53657",
        orange: "#ff6031",
        blue: "#5482bb",
        "dark-blue": "#405983",
        brown: "#bd935e",
        "dark-brown": "#6b4a2f",
        green: "#3fbb8b",
        "dark-green": "#1d7d72",
        "washed-green": "#889d8d",
        purple: "#a297c1",
        "dark-purple": "#5e5e93",
        "washed-purple": "#b8a8c9",
        grey: "#94acb8",
        "dark-grey": "#5f7684"
    };

    function padFrame(frame, width) {
        if (typeof frame === "string") {
            return frame;
        }
        var digits = String(frame);
        while (digits.length < width) {
            digits = "0" + digits;
        }
        return digits;
    }

    function framesToPaths(base, folder, prefix, stem, frames, width) {
        return (frames || []).map(function (frame) {
            return base + folder + "/" + prefix + stem + padFrame(frame, width) + ".png";
        });
    }

    function design(folder, stem, options) {
        options = options || {};
        var width = options.pad == null ? 5 : options.pad;

        function color(id, spec) {
            spec = spec || {};
            var imagesByMaterial = {};
            if (spec.sw && spec.sw.length) {
                imagesByMaterial["snow-washed"] = framesToPaths(SW, folder, "SW_", stem, spec.sw, width);
            }
            if (spec.ec && spec.ec.length) {
                imagesByMaterial["essential-cotton"] = framesToPaths(EC, folder, "EC_", stem, spec.ec, width);
            }
            return {
                id: id,
                label: spec.label || id.replace(/-/g, " "),
                hex: spec.hex || PALETTE[id] || "#e7dacb",
                priceDelta: spec.priceDelta || 0,
                imagesByMaterial: imagesByMaterial
            };
        }

        function colors(map) {
            return Object.keys(map).map(function (id) {
                return color(id, map[id]);
            });
        }

        function images(spec) {
            spec = spec || {};
            var out = {};
            if (spec.sw && spec.sw.length) {
                out["snow-washed"] = framesToPaths(SW, folder, "SW_", stem, spec.sw, width);
            }
            if (spec.ec && spec.ec.length) {
                out["essential-cotton"] = framesToPaths(EC, folder, "EC_", stem, spec.ec, width);
            }
            return out;
        }

        return { color: color, colors: colors, images: images };
    }

    function shirt(spec) {
        return {
            id: spec.id,
            title: spec.title,
            description: spec.description || "",
            price: spec.price,
            colors: spec.colors,
            imagesByMaterial: spec.imagesByMaterial,
            images: spec.images,
            materials: spec.materials || MATERIALS,
            sizes: spec.sizes || ["S", "M", "L", "XL"],
            swatch: spec.swatch || "blue"
        };
    }

    window.SHOP_SHIRT_CATALOG = {
        MATERIALS: MATERIALS,
        PALETTE: PALETTE,
        design: design,
        shirt: shirt
    };
})();
