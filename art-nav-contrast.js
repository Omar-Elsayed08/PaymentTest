(function () {
    "use strict";

    function init() {
        var banner = document.querySelector(".art-banner");
        var toggle = document.querySelector(".nav-toggle");
        if (!banner || !toggle) return;

        var ticking = false;

        function updateContrast() {
            var toggleRect = toggle.getBoundingClientRect();
            var bannerRect = banner.getBoundingClientRect();

            var overlaps =
                toggleRect.left < bannerRect.right &&
                toggleRect.right > bannerRect.left &&
                toggleRect.top < bannerRect.bottom &&
                toggleRect.bottom > bannerRect.top;

            toggle.classList.toggle("nav-toggle--on-dark", overlaps);
            ticking = false;
        }

        function requestUpdate() {
            if (!ticking) {
                requestAnimationFrame(updateContrast);
                ticking = true;
            }
        }

        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);

        // Run once immediately, and again after the banner image
        // finishes loading (its rendered size may shift once it loads).
        updateContrast();
        if (!banner.complete) {
            banner.addEventListener("load", updateContrast, { once: true });
        }
        window.addEventListener("load", updateContrast, { once: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();