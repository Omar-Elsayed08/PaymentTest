(function () {
    "use strict";

    var cart = window.EBCart;

    var listEl = document.querySelector("[data-cart-list]");
    var emptyEl = document.querySelector("[data-cart-empty]");
    var summaryEl = document.querySelector("[data-cart-summary]");
    var subtotalEl = document.querySelector("[data-cart-subtotal]");
    var checkoutBtn = document.querySelector("[data-checkout]");

    if (!cart || !listEl) {
        return;
    }

    function buildRow(line) {
        var row = document.createElement("article");
        row.className = "cart-item";

        var media = document.createElement("div");
        media.className = "cart-item__media";
        if (line.image) {
            var img = document.createElement("img");
            img.src = line.image;
            img.alt = line.title;
            media.appendChild(img);
        }

        var bar = document.createElement("div");
        bar.className = "cart-item__bar cart-item__bar--" + line.swatch;

        var info = document.createElement("div");
        info.className = "cart-item__info";
        var title = document.createElement("h2");
        title.className = "cart-item__title";
        title.textContent = line.title;
        var size = document.createElement("p");
        size.className = "cart-item__size";
        size.textContent = "Size: " + (line.size || "-");
        info.appendChild(title);
        info.appendChild(size);

        var controls = document.createElement("div");
        controls.className = "cart-item__controls";

        var qty = document.createElement("div");
        qty.className = "cart-item__qty";
        qty.setAttribute("role", "group");
        qty.setAttribute("aria-label", "Quantity for " + line.title);

        var dec = document.createElement("button");
        dec.type = "button";
        dec.className = "cart-item__qty-btn";
        dec.textContent = "-";
        dec.setAttribute("aria-label", "Decrease quantity");
        dec.addEventListener("click", function () {
            cart.updateQty(line.id, line.size, line.qty - 1);
        });

        var qtyVal = document.createElement("span");
        qtyVal.className = "cart-item__qty-value";
        qtyVal.textContent = line.qty;

        var inc = document.createElement("button");
        inc.type = "button";
        inc.className = "cart-item__qty-btn";
        inc.textContent = "+";
        inc.setAttribute("aria-label", "Increase quantity");
        inc.addEventListener("click", function () {
            cart.updateQty(line.id, line.size, line.qty + 1);
        });

        qty.appendChild(dec);
        qty.appendChild(qtyVal);
        qty.appendChild(inc);

        var price = document.createElement("span");
        price.className = "cart-item__price";
        price.textContent = cart.formatPrice(line.lineTotalCents);

        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "cart-item__remove";
        remove.textContent = "\u2715";
        remove.setAttribute("aria-label", "Remove " + line.title);
        remove.addEventListener("click", function () {
            cart.removeItem(line.id, line.size);
        });

        controls.appendChild(qty);
        controls.appendChild(price);
        controls.appendChild(remove);

        bar.appendChild(info);
        bar.appendChild(controls);

        row.appendChild(media);
        row.appendChild(bar);
        return row;
    }

    function render() {
        var lines = cart.getDetailedCart();
        listEl.innerHTML = "";

        if (!lines.length) {
            if (emptyEl) {
                emptyEl.hidden = false;
            }
            if (summaryEl) {
                summaryEl.hidden = true;
            }
            if (subtotalEl) {
                subtotalEl.textContent = cart.formatPrice(0);
            }
            return;
        }

        if (emptyEl) {
            emptyEl.hidden = true;
        }
        if (summaryEl) {
            summaryEl.hidden = false;
        }

        var fragment = document.createDocumentFragment();
        lines.forEach(function (line) {
            fragment.appendChild(buildRow(line));
        });
        listEl.appendChild(fragment);

        subtotalEl.textContent = cart.formatPrice(cart.getSubtotalCents());
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", function () {
            cart.checkout();
        });
    }

    render();
    cart.onChange(render);
})();
