(function () {
    "use strict";
    var NAV_STACK_LAYOUT = {
        startPercent: 0,
        heights: [26, 20, 19, 18, 17]
    };

    var NAV_LINKS = [
        { label: "Menu", static: true },
        { label: "Home", page: "index.html", home: true },
        { label: "About Me", page: "about/about.html" },
        { label: "Gallery", page: "gallery/gallery.html" },
        { label: "Shop", page: "shop/shop.html" }
    ];

    function getRootPrefix() {
        var script = document.currentScript;
        var src = script && script.getAttribute("src");
        if (!src || src.indexOf("/") === -1) {
            return "";
        }
        var parts = src.split("/");
        parts.pop();
        return parts.length ? parts.join("/") + "/" : "";
    }

    function buildNavMenu(prefix) {
        var nav = document.createElement("nav");
        nav.className = "nav-menu";
        nav.id = "nav-menu";
        nav.setAttribute("aria-hidden", "true");

        var panel = document.createElement("div");
        panel.className = "nav-menu__panel";

        var content = document.createElement("div");
        content.className = "nav-menu__content";

        var logo = document.createElement("img");
        logo.className = "nav-menu__logo";
        logo.src = prefix + "assets/images/EverythingBurgerText.svg";
        logo.alt = "Everything Burger";

        var stack = document.createElement("div");
        stack.className = "nav-stack";

        var reveal = document.createElement("div");
        reveal.className = "nav-stack__reveal";

        var stackImg = document.createElement("img");
        stackImg.className = "nav-stack__image";
        stackImg.src = prefix + "assets/images/BurgerStack.png";
        stackImg.alt = "";
        reveal.appendChild(stackImg);

        var layers = document.createElement("div");
        layers.className = "nav-stack__layers";
        layers.style.setProperty("--nav-stack-start", NAV_STACK_LAYOUT.startPercent + "%");

        NAV_LINKS.forEach(function (link, index) {
            var slot = document.createElement(link.static ? "span" : "a");
            slot.className = "nav-stack__btn" + (link.static ? " nav-stack__btn--label" : "");
            slot.style.setProperty("--nav-slot-height", NAV_STACK_LAYOUT.heights[index] + "%");

            if (!link.static) {
                if (link.home && !prefix) {
                    slot.href = "#";
                } else {
                    slot.href = prefix + link.page;
                }
            }

            slot.textContent = link.label;
            layers.appendChild(slot);
        });

        stack.appendChild(reveal);
        stack.appendChild(layers);
        content.appendChild(logo);
        content.appendChild(stack);
        panel.appendChild(content);
        nav.appendChild(panel);
        return nav;
    }

    function mountNavMenu() {
        var prefix = getRootPrefix();
        var existing = document.getElementById("nav-menu");
        if (existing) {
            existing.remove();
        }

        var menu = buildNavMenu(prefix);
        var toggle = document.querySelector(".nav-toggle");
        var toolbar = toggle && toggle.closest(".shop-toolbar");

        if (toolbar) {
            toolbar.insertAdjacentElement("afterend", menu);
        } else if (toggle) {
            toggle.insertAdjacentElement("afterend", menu);
        } else {
            document.body.insertBefore(menu, document.body.firstChild);
        }

        return menu;
    }

    var menu = mountNavMenu();
    var toggle = document.querySelector(".nav-toggle");
    var scrollY = 0;

    function setMenuOpen(isOpen) {
        if (!toggle || !menu) {
            return;
        }
        if (isOpen) {
            scrollY = window.scrollY;
            document.body.style.top = "-" + scrollY + "px";
            document.documentElement.classList.add("nav-open");
            document.body.classList.add("nav-open");
            menu.classList.add("is-open");
            toggle.setAttribute("aria-expanded", "true");
            menu.setAttribute("aria-hidden", "false");
            toggle.setAttribute("aria-label", "Close menu");
        } else {
            menu.classList.remove("is-open");
            document.documentElement.classList.remove("nav-open");
            document.body.classList.remove("nav-open");
            document.body.style.top = "";
            window.scrollTo(0, scrollY);
            toggle.setAttribute("aria-expanded", "false");
            menu.setAttribute("aria-hidden", "true");
            toggle.setAttribute("aria-label", "Open menu");
        }
    }

    if (toggle && menu) {
        toggle.addEventListener("click", function () {
            setMenuOpen(!menu.classList.contains("is-open"));
        });

        menu.addEventListener("click", function (event) {
            if (event.target === menu) {
                setMenuOpen(false);
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && menu.classList.contains("is-open")) {
                setMenuOpen(false);
                toggle.focus();
            }
        });
    }
})();
