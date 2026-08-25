const scrollStars = [
    { el: document.querySelector(".paper-star"), speed: 0.12 },
    { el: document.querySelector(".white-star"), speed: -0.09 },
    { el: document.querySelector(".small-paper-star"), speed: 0.15 },
    { el: document.querySelector(".shadow-star"), speed: -0.11 },
    { el: document.querySelector(".sharp-explosion__img"), speed: 0.08 },
    { el: document.querySelector(".about-shadow-star__img"), speed: -0.11 }
].filter((item) => item.el);

function usesSelfTransform(el) {
    return el.classList.contains("sharp-explosion__img")
        || el.classList.contains("about-shadow-star__img");
}

function renderStars() {
    const scrollY = window.scrollY || window.pageYOffset;

    scrollStars.forEach(({ el, speed }) => {
        if (usesSelfTransform(el)) {
            el.style.transform = `rotate(${scrollY * speed}deg)`;
            return;
        }

        el.style.setProperty("--layer-rotate", `${scrollY * speed}deg`);
    });
}

if (scrollStars.length) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
        scrollStars.forEach(({ el }) => {
            if (usesSelfTransform(el)) {
                el.style.transform = "none";
                return;
            }

            el.style.removeProperty("--layer-rotate");
        });
    } else {
        let ticking = false;

        const onScroll = () => {
            if (ticking) {
                return;
            }
            ticking = true;
            requestAnimationFrame(() => {
                renderStars();
                ticking = false;
            });
        };

        renderStars();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
    }
}
