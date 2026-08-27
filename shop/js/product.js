
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

    function formatDelta(delta) {
        if (!delta) {
            return "";
        }
        return (delta > 0 ? "+" : "-") + formatPrice(Math.abs(delta));
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

    /* Selection state — the single source of truth for images and price. */
    var colorOptions = data.getColorOptions(item);
    var materialOptions = data.getMaterialOptions(item);
    var selection = {
        color: colorOptions.length ? colorOptions[0].id : "",
        material: materialOptions.length ? materialOptions[0].id : ""
    };

    /* What the shopper is hovering, which the buttons treat as a provisional
     * selection so each group can show what the other one would allow. */
    var preview = { color: null, material: null };

    function effective(key) {
        return preview[key] != null ? preview[key] : selection[key];
    }

    function variantFor(overrides) {
        return data.resolveVariant(item, Object.assign({}, selection, overrides || {}));
    }

    function isAvailable(colorId, materialId) {
        return data.isVariantAvailable(item, { color: colorId, material: materialId });
    }

    /* Never open on a pair that has no renders, which would leave every button
     * in both groups disabled. */
    function selectFirstAvailable() {
        if (isAvailable(selection.color, selection.material)) {
            return;
        }
        var colorIds = colorOptions.length ? colorOptions.map(optionId) : [""];
        var materialIds = materialOptions.length ? materialOptions.map(optionId) : [""];

        for (var c = 0; c < colorIds.length; c += 1) {
            for (var m = 0; m < materialIds.length; m += 1) {
                if (isAvailable(colorIds[c], materialIds[m])) {
                    selection.color = colorIds[c];
                    selection.material = materialIds[m];
                    return;
                }
            }
        }
    }

    function optionId(option) {
        return option.id;
    }

    selectFirstAvailable();

    /* Gallery */
    var imgEl = document.querySelector("[data-product-img]");
    var thumbsEl = document.querySelector("[data-product-thumbs]");
    var navEl = document.querySelector("[data-product-nav]");
    var prevBtn = document.querySelector("[data-product-prev]");
    var nextBtn = document.querySelector("[data-product-next]");
    var images = [];
    var activeIndex = 0;

    function renderActiveImage() {
        if (!imgEl) {
            return;
        }
        if (!images.length) {
            imgEl.hidden = true;
            imgEl.removeAttribute("src");
            return;
        }
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

    function renderThumbs() {
        if (!thumbsEl) {
            return;
        }
        thumbsEl.innerHTML = "";
        thumbsEl.hidden = images.length < 2;
        if (images.length < 2) {
            return;
        }
        images.forEach(function (src, index) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "product-thumb";
            btn.setAttribute("data-product-thumb", "");
            btn.setAttribute("aria-label", "Show image " + (index + 1) + " of " + images.length);
            btn.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
            if (index === activeIndex) {
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

    function setActiveImage(index) {
        if (!images.length) {
            return;
        }
        activeIndex = (index + images.length) % images.length;
        renderActiveImage();
    }

    /* Swapping colorways keeps the angle the shopper is already looking at. */
    function setGallery(nextImages, keepIndex) {
        images = (nextImages || []).filter(Boolean);
        activeIndex = keepIndex ? Math.min(activeIndex, Math.max(images.length - 1, 0)) : 0;
        if (navEl) {
            navEl.hidden = images.length < 2;
        }
        renderThumbs();
        renderActiveImage();
    }

    function preloadImages(list) {
        (list || []).forEach(function (src) {
            var preload = new Image();
            preload.src = src;
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", function () {
            setActiveImage(activeIndex - 1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", function () {
            setActiveImage(activeIndex + 1);
        });
    }

    setGallery(variantFor().images, false);

    /* Tag text */
    var priceEl = document.querySelector("[data-product-price]");
    document.querySelector("[data-product-title]").textContent = item.title;
    document.querySelector("[data-product-desc]").textContent = item.description || "";

    function renderPrice(overrides) {
        if (priceEl) {
            priceEl.textContent = formatPrice(variantFor(overrides).price);
        }
    }

    renderPrice();

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

    /* A small note that trails the cursor, used to explain why an option is
     * greyed out. Lives on <body> so it is never clipped by the form. */
    var cursorTip = (function () {
        var el = null;
        var offsetX = 14;
        var offsetY = 18;

        function ensure() {
            if (!el) {
                el = document.createElement("div");
                el.className = "product-tip";
                el.setAttribute("role", "status");
                el.hidden = true;
                document.body.appendChild(el);
            }
            return el;
        }

        function place(x, y) {
            var tip = ensure();
            var width = tip.offsetWidth;
            var height = tip.offsetHeight;
            var maxX = window.innerWidth - width - 8;
            var left = Math.max(8, Math.min(x + offsetX, maxX));
            var top = y + offsetY;
            if (top + height > window.innerHeight - 8) {
                top = y - height - offsetY / 2;
            }
            tip.style.left = left + "px";
            tip.style.top = top + "px";
        }

        return {
            show: function (text, x, y) {
                if (!text) {
                    return;
                }
                var tip = ensure();
                tip.textContent = text;
                tip.hidden = false;
                place(x, y);
            },
            move: function (x, y) {
                if (el && !el.hidden) {
                    place(x, y);
                }
            },
            showAt: function (text, rect) {
                this.show(text, rect.left - offsetX, rect.bottom - offsetY / 2);
            },
            hide: function () {
                if (el) {
                    el.hidden = true;
                }
            }
        };
    })();

    window.addEventListener("scroll", function () {
        cursorTip.hide();
    }, { passive: true });

    
    function createOptionGroup(config) {
        var fieldEl = config.fieldEl;
        var listEl = config.listEl;
        var options = config.options || [];

        if (!fieldEl || !listEl || !options.length) {
            if (fieldEl) {
                fieldEl.hidden = true;
            }
            return { refresh: function () {} };
        }

        var buttons = [];

        function isDisabled(option) {
            return typeof config.isDisabled === "function" && config.isDisabled(option);
        }

        
        function resolveSelection(option) {
            return typeof config.resolve === "function" ? config.resolve(option) : null;
        }

        function noteFor(option) {
            return typeof config.disabledNote === "function" ? config.disabledNote(option) : "";
        }

        function refresh() {
            var selectedId = config.getSelectedId();
            buttons.forEach(function (entry) {
                var isActive = entry.option.id === selectedId;
                var disabled = isDisabled(entry.option);
                var blocked = disabled && !resolveSelection(entry.option);

                entry.btn.classList.toggle("is-active", isActive);
                entry.btn.setAttribute("aria-pressed", isActive ? "true" : "false");

             
                entry.btn.setAttribute("aria-disabled", blocked ? "true" : "false");
                entry.btn.classList.toggle("is-unavailable", disabled);
                entry.btn.classList.toggle("is-blocked", blocked);

                if (disabled) {
                    entry.btn.setAttribute("aria-label", entry.option.label + " — " + noteFor(entry.option));
                } else {
                    entry.btn.removeAttribute("aria-label");
                }
            });
        }

        options.forEach(function (option) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "product-option__btn product-option__btn--" + config.modifier;
            btn.setAttribute("data-option-id", option.id);
            btn.setAttribute("aria-pressed", "false");
            config.buildContent(btn, option);

            btn.addEventListener("click", function () {
                var next = resolveSelection(option);
                if (!next) {
                    return;
                }
                cursorTip.hide();
                applySelection(next);
            });

            function startPreview(event) {
                if (isDisabled(option)) {
                    var note = noteFor(option);
                    if (event && typeof event.clientX === "number") {
                        cursorTip.show(note, event.clientX, event.clientY);
                    } else {
                        cursorTip.showAt(note, btn.getBoundingClientRect());
                    }
                    return;
                }
                if (config.onPreview) {
                    config.onPreview(option);
                    refreshOptionGroups();
                }
            }

            function endPreview() {
                cursorTip.hide();
                if (config.onPreviewEnd) {
                    config.onPreviewEnd();
                    refreshOptionGroups();
                }
            }

            btn.addEventListener("mouseenter", startPreview);
            btn.addEventListener("focus", startPreview);
            btn.addEventListener("mousemove", function (event) {
                if (isDisabled(option)) {
                    cursorTip.move(event.clientX, event.clientY);
                }
            });
            btn.addEventListener("mouseleave", endPreview);
            btn.addEventListener("blur", endPreview);

            buttons.push({ btn: btn, option: option });
            listEl.appendChild(btn);
        });

        fieldEl.hidden = false;
        refresh();
        return { refresh: refresh };
    }

    
    function materialFor(colorId) {
        if (isAvailable(colorId, selection.material)) {
            return selection.material;
        }
        var match = materialOptions.find(function (option) {
            return isAvailable(colorId, option.id);
        });
        return match ? match.id : null;
    }

    function colorFor(materialId) {
        if (isAvailable(selection.color, materialId)) {
            return selection.color;
        }
        var match = colorOptions.find(function (option) {
            return isAvailable(option.id, materialId);
        });
        return match ? match.id : null;
    }

    function labelFor(options, id) {
        var match = options.find(function (option) {
            return option.id === id;
        });
        return match ? match.label : "";
    }

    function applySelection(next) {
        selection.color = next.color;
        selection.material = next.material;
        preview.color = null;
        preview.material = null;
        setGallery(variantFor().images, true);
        renderPrice();
        refreshOptionGroups();
    }

    function appendText(btn, className, text) {
        if (!text) {
            return;
        }
        var span = document.createElement("span");
        span.className = className;
        span.textContent = text;
        btn.appendChild(span);
    }

    /* Colors — hovering previews the colorway, clicking commits it. */
    var colorGroup = createOptionGroup({
        fieldEl: document.querySelector("[data-color-field]"),
        listEl: document.querySelector("[data-color-options]"),
        options: colorOptions,
        modifier: "color",
        getSelectedId: function () {
            return selection.color;
        },
        buildContent: function (btn, option) {
            var chip = document.createElement("span");
            chip.className = "product-option__chip";
            chip.style.backgroundColor = option.hex;
            chip.setAttribute("aria-hidden", "true");
            btn.appendChild(chip);
            appendText(btn, "product-option__text", option.label);
            appendText(btn, "product-option__note", formatDelta(option.priceDelta));
        },
        isDisabled: function (option) {
            return !isAvailable(option.id, effective("material"));
        },
        resolve: function (option) {
            var materialId = materialFor(option.id);
            return materialId === null ? null : { color: option.id, material: materialId };
        },
        disabledNote: function (option) {
            var materialId = materialFor(option.id);
            if (materialId === null) {
                return "not available";
            }
            return "not available in this material — switch to "
                + labelFor(materialOptions, materialId);
        },
        onPreview: function (option) {
            preview.color = option.id;
            setGallery(variantFor({ color: option.id }).images, true);
            renderPrice({ color: option.id });
        },
        onPreviewEnd: function () {
            preview.color = null;
            setGallery(variantFor().images, true);
            renderPrice();
        }
    });

    /* Materials — each one is rendered in its own mockup folder, so the gallery
     * follows the same hover-to-preview, click-to-commit flow as the colors. */
    var materialGroup = createOptionGroup({
        fieldEl: document.querySelector("[data-material-field]"),
        listEl: document.querySelector("[data-material-options]"),
        options: materialOptions,
        modifier: "material",
        getSelectedId: function () {
            return selection.material;
        },
        buildContent: function (btn, option) {
            appendText(btn, "product-option__text", option.label);
            var base = Number(item.price) || 0;
            var delta = option.price != null
                ? option.price + option.priceDelta - base
                : option.priceDelta;
            appendText(btn, "product-option__note", formatDelta(delta) || option.note);
        },
        isDisabled: function (option) {
            return !isAvailable(effective("color"), option.id);
        },
        resolve: function (option) {
            var colorId = colorFor(option.id);
            return colorId === null ? null : { color: colorId, material: option.id };
        },
        disabledNote: function (option) {
            var colorId = colorFor(option.id);
            if (colorId === null) {
                return "not available";
            }
            return "not available in this color — click to switch to "
                + labelFor(colorOptions, colorId);
        },
        onPreview: function (option) {
            preview.material = option.id;
            setGallery(variantFor({ material: option.id }).images, true);
            renderPrice({ material: option.id });
        },
        onPreviewEnd: function () {
            preview.material = null;
            setGallery(variantFor().images, true);
            renderPrice();
        }
    });

    /* Picking one option changes what the other group can offer, so both
     * groups re-evaluate after every choice. */
    function refreshOptionGroups() {
        colorGroup.refresh();
        materialGroup.refresh();
    }

    /* Warm every combination that exists so hovering swaps instantly. */
    function preloadVariants() {
        var colorIds = colorOptions.length ? colorOptions.map(optionId) : [""];
        var materialIds = materialOptions.length ? materialOptions.map(optionId) : [""];

        colorIds.forEach(function (colorId) {
            materialIds.forEach(function (materialId) {
                if (isAvailable(colorId, materialId)) {
                    preloadImages(variantFor({ color: colorId, material: materialId }).images);
                }
            });
        });
    }

    preloadVariants();

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
        if (!isAvailable(selection.color, selection.material)) {
            flash("That combination isn't available.");
            return;
        }
        if (cart) {
            cart.addItem(item.id, size, qty, {
                color: selection.color,
                material: selection.material
            });
            var described = data.describeVariant(variantFor());
            flash("Added " + qty + " to cart" + (described ? " (" + described + ")" : "") + ".");
        }
    });

    refreshOptionGroups();

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
