
(function () {
    "use strict";

    var grid = document.querySelector("[data-shirt-grid]");
    var data = window.SHOP_DATA;

    function shopPageUrl(page) {
        var path = window.location.pathname;
        if (path.indexOf("/shop/") === -1 && !path.endsWith("/shop")) {
            return "shop/" + page;
        }
        if (/\/shop\/(shirts|prints|more|cart)\//.test(path)) {
            return "../" + page;
        }
        return page;
    }

    function buildTile(item) {
        var tile = document.createElement("a");
        tile.className = "shirt-tile";
        tile.href = shopPageUrl("product.html?id=" + encodeURIComponent(item.id));

        var swatch = document.createElement("div");
        swatch.className = "shirt-tile__swatch shirt-tile__swatch--" + (item.swatch || "blue");
        swatch.setAttribute("aria-hidden", "true");

        if (item.images && item.images[0]) {
            var img = document.createElement("img");
            img.className = "shirt-tile__img";
            img.src = item.images[0];
            img.alt = "";
            img.loading = "lazy";
            swatch.appendChild(img);
        }

        var label = document.createElement("span");
        label.className = "shirt-tile__label";
        label.textContent = item.title;

        tile.appendChild(swatch);
        tile.appendChild(label);
        return tile;
    }

    if (grid && data && Array.isArray(data.items)) {
        var category = grid.getAttribute("data-category");
        var items = category
            ? data.items.filter(function (item) {
                return item.category === category;
            })
            : data.items;
        var fragment = document.createDocumentFragment();
        items.forEach(function (item) {
            fragment.appendChild(buildTile(item));
        });
        grid.appendChild(fragment);
    }

    /* Cart button count */
    function updateCartCount() {
        var badge = document.querySelector("[data-cart-count]");
        if (!badge || !window.EBCart) {
            return;
        }
        var count = window.EBCart.getCount();
        badge.textContent = count;
        badge.hidden = count === 0;
    }

    if (window.EBCart) {
        updateCartCount();
        window.EBCart.onChange(updateCartCount);
    }
})();
