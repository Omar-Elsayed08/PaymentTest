(function () {
    const gallery = document.querySelector('.art-gallery');
    const lightbox = document.getElementById('lightbox');
    if (!gallery || !lightbox) return;

    const lightboxImage = document.getElementById('lightbox-image');
    const closeBtn = lightbox.querySelector('.lightbox__close');

    function openLightbox(img) {
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt || '';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => lightbox.classList.add('is-visible'));
    }

    function closeLightbox() {
        lightbox.classList.remove('is-visible');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lightbox.addEventListener('transitionend', function handler(e) {
            if (e.target !== lightbox) return;
            lightbox.classList.remove('is-open');
            lightboxImage.src = '';
            lightbox.removeEventListener('transitionend', handler);
        }, { once: true });
    }

    gallery.addEventListener('click', (e) => {
        const img = e.target.closest('.art-entry__image img');
        if (img) openLightbox(img);
    });

    closeBtn.addEventListener('click', closeLightbox);

    // click outside the image (on the white overlay) also closes it
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
})();