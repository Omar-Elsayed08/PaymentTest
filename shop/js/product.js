
(function () {
    "use strict";

    var data = window.SHOP_DATA;
    var cart = window.EBCart;

    var layout = document.querySelector("[data-product]");
    var missing = document.querySelector("[data-product-missing]");

    function getId() {
        var params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    function showMissing() {
        if (layout) {
            layout.hidden = true;
        }
        if (missing) {
            missing.hidden = false;
        }
    }

    function formatPrice(price) {
        return "$" + (Number(price) || 0).toFixed(2);
    }

    function setBackLink(category) {
        var backEl = document.querySelector("[data-shop-back]");
        if (!backEl) {
            return;
        }
        var pages = {
            shirts: "shirts/shirts.html",
            prints: "prints/prints.html",
            more: "more/more.html"
        };
        backEl.href = pages[category] || "shop.html";
    }

    var item = data && data.getItem ? data.getItem(getId()) : null;

    if (!item) {
        setBackLink();
        showMissing();
        wireCartCount();
        return;
    }

    setBackLink(item.category);

    /* Images */
    var imgEl = document.querySelector("[data-product-img]");
    var thumbsEl = document.querySelector("[data-product-thumbs]");
    var navEl = document.querySelector("[data-product-nav]");
    var prevBtn = document.querySelector("[data-product-prev]");
    var nextBtn = document.querySelector("[data-product-next]");
    var images = item.images && item.images.length ? item.images.filter(Boolean) : [];
    var activeIndex = 0;

    function setActiveImage(index) {
        if (!images.length || !imgEl) {
            return;
        }
        activeIndex = (index + images.length) % images.length;
        imgEl.src = images[activeIndex];
        imgEl.alt = item.title + " — image " + (activeIndex + 1) + " of " + images.length;
        imgEl.hidden = false;

        if (thumbsEl) {
            thumbsEl.querySelectorAll("[data-product-thumb]").forEach(function (btn, i) {
                var isActive = i === activeIndex;
                btn.classList.toggle("is-active", isActive);
                btn.setAttribute("aria-selected", isActive ? "true" : "false");
            });
        }
    }

    function stepImage(delta) {
        setActiveImage(activeIndex + delta);
    }

    if (images.length) {
        setActiveImage(0);

        if (images.length > 1) {
            if (navEl) {
                navEl.hidden = false;
            }
            if (prevBtn) {
                prevBtn.addEventListener("click", function () {
                    stepImage(-1);
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener("click", function () {
                    stepImage(1);
                });
            }
        }

        if (thumbsEl && images.length > 1) {
            thumbsEl.hidden = false;
            images.forEach(function (src, index) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "product-thumb";
                btn.setAttribute("data-product-thumb", "");
                btn.setAttribute("aria-label", "Show image " + (index + 1) + " of " + images.length);
                btn.setAttribute("aria-selected", index === 0 ? "true" : "false");
                if (index === 0) {
                    btn.classList.add("is-active");
                }

                var thumbImg = document.createElement("img");
                thumbImg.src = src;
                thumbImg.alt = "";
                btn.appendChild(thumbImg);

                btn.addEventListener("click", function () {
                    setActiveImage(index);
                });

                thumbsEl.appendChild(btn);
            });
        }
    }

    /* Tag text */
    document.querySelector("[data-product-title]").textContent = item.title;
    document.querySelector("[data-product-price]").textContent = formatPrice(item.price);
    document.querySelector("[data-product-desc]").textContent = item.description || "";

    /* Sizes */
    var sizeField = document.querySelector("[data-size-field]");
    var sizeValue = document.querySelector("[data-size-value]");
    var sizeDec = document.querySelector("[data-size-dec]");
    var sizeInc = document.querySelector("[data-size-inc]");
    var sizes = item.sizes && item.sizes.length ? item.sizes.slice() : [];
    var sizeIndex = 0;

    function renderSize() {
        if (!sizes.length || !sizeValue) {
            return;
        }
        sizeValue.textContent = sizes[sizeIndex];
        if (sizeDec) {
            sizeDec.disabled = sizeIndex <= 0;
        }
        if (sizeInc) {
            sizeInc.disabled = sizeIndex >= sizes.length - 1;
        }
    }

    if (sizes.length) {
        renderSize();
        if (sizeDec) {
            sizeDec.addEventListener("click", function () {
                if (sizeIndex > 0) {
                    sizeIndex -= 1;
                    renderSize();
                }
            });
        }
        if (sizeInc) {
            sizeInc.addEventListener("click", function () {
                if (sizeIndex < sizes.length - 1) {
                    sizeIndex += 1;
                    renderSize();
                }
            });
        }
    } else if (sizeField) {
        sizeField.hidden = true;
    }

    /* Quantity stepper */
    var qty = 1;
    var qtyValue = document.querySelector("[data-qty-value]");
    var qtyDec = document.querySelector("[data-qty-dec]");
    var qtyInc = document.querySelector("[data-qty-inc]");

    function renderQty() {
        qtyValue.textContent = qty;
        qtyDec.disabled = qty <= 1;
    }

    qtyDec.addEventListener("click", function () {
        if (qty > 1) {
            qty -= 1;
            renderQty();
        }
    });
    qtyInc.addEventListener("click", function () {
        qty += 1;
        renderQty();
    });
    renderQty();

    /* Add to cart */
    var form = document.querySelector("[data-product-form]");
    var msg = document.querySelector("[data-product-msg]");

    function flash(text) {
        if (!msg) {
            return;
        }
        msg.textContent = text;
        msg.hidden = false;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var size = "";
        if (sizes.length) {
            size = sizes[sizeIndex];
            if (!size) {
                flash("Please select a size.");
                if (sizeDec) {
                    sizeDec.focus();
                }
                return;
            }
        }
        if (cart) {
            cart.addItem(item.id, size, qty);
            flash("Added " + qty + " to cart.");
        }
    });

    layout.hidden = false;
    wireDescClearance();
    wireCartCount();

    function wireDescClearance() {
        var tagEl = document.querySelector(".product-tag");
        var blockEl = document.querySelector("[data-product-tag-block]");
        if (!tagEl || !blockEl) {
            return;
        }

        var desktopQuery = window.matchMedia("(min-width: 800px)");
        var ticking = false;

        function getGapPx() {
            var blockStyles = getComputedStyle(blockEl);
            return parseFloat(blockStyles.rowGap || blockStyles.gap) || 16;
        }

        function sync() {
            if (!desktopQuery.matches) {
                blockEl.style.paddingTop = "";
                return;
            }

            var tagRect = tagEl.getBoundingClientRect();
            var blockRect = blockEl.getBoundingClientRect();
            var overlapsHorizontally = tagRect.left < blockRect.right && tagRect.right > blockRect.left;

            if (!overlapsHorizontally) {
                blockEl.style.paddingTop = "";
                return;
            }

            var needed = tagRect.bottom - blockRect.top + getGapPx();
            blockEl.style.paddingTop = needed > 0 ? needed + "px" : "";
        }

        function scheduleSync() {
            if (ticking) {
                return;
            }
            ticking = true;
            requestAnimationFrame(function () {
                sync();
                ticking = false;
            });
        }

        var tagImg = tagEl.querySelector(".product-tag__img");
        if (tagImg && !tagImg.complete) {
            tagImg.addEventListener("load", scheduleSync);
        }

        window.addEventListener("resize", scheduleSync, { passive: true });
        if (typeof desktopQuery.addEventListener === "function") {
            desktopQuery.addEventListener("change", scheduleSync);
        } else if (typeof desktopQuery.addListener === "function") {
            desktopQuery.addListener(scheduleSync);
        }

        if (typeof ResizeObserver !== "undefined") {
            var observer = new ResizeObserver(scheduleSync);
            observer.observe(tagEl);
            observer.observe(blockEl);
        }

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(scheduleSync);
        }

        scheduleSync();
    }

    function wireCartCount() {
        var badge = document.querySelector("[data-cart-count]");
        if (!badge || !cart) {
            return;
        }
        function update() {
            var count = cart.getCount();
            badge.textContent = count;
            badge.hidden = count === 0;
        }
        update();
        cart.onChange(update);
    }
})();
