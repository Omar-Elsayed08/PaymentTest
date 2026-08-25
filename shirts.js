const shopTrigger = document.querySelector(".shop-sign");
const shopShirts = Array.from(document.querySelectorAll(".shop-shirt__img"));

const SHIRT_STAGGER = 0.22;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function scrollProgress() {
    const rect = shopTrigger.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
        const start = vh;
        const end = vh * 0.52;
        return clamp((start - rect.top) / (start - end), 0, 1);
    }

    const start = vh * 1.1;
    const end = -vh * 0.5;
    return clamp((start - rect.top) / (start - end), 0, 1);
}

function renderShirts() {
    const progress = scrollProgress();
    const count = shopShirts.length;
    const span = 1 - SHIRT_STAGGER * (count - 1);
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    shopShirts.forEach((img, index) => {
        const start = index * SHIRT_STAGGER;
        const local = clamp((progress - start) / span, 0, 1);
        const eased = easeOutBack(local);
        const containerLeft = img.parentElement.getBoundingClientRect().left;
        const offscreen = viewportWidth - containerLeft;
        const x = (1 - eased) * offscreen;
        const pop = 1 + Math.max(eased - 1, 0) * 0.6;
        img.style.transform = `translate3d(${x}px, 0, 0) scale(${pop})`;
    });
}

if (shopTrigger && shopShirts.length) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
        shopShirts.forEach((img) => {
            img.style.transform = "none";
        });
    } else {
        let ticking = false;

        const onScroll = () => {
            if (ticking) {
                return;
            }
            ticking = true;
            requestAnimationFrame(() => {
                renderShirts();
                ticking = false;
            });
        };

        renderShirts();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
    }
}
