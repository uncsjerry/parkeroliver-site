/* ==========================================================================
   Parker Oliver — parkeroliver.com
   Main JavaScript
   ========================================================================== */

(function () {
  'use strict';

  // ---------- Mobile menu ----------
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // WHY: Close menu when a link is tapped so user sees the section
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Scroll reveal ----------
  const reveals = document.querySelectorAll('.reveal');

  function checkReveal() {
    const triggerBottom = window.innerHeight * 0.88;
    reveals.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < triggerBottom) {
        el.classList.add('visible');
      }
    });
  }

  // WHY: Run once on load for above-fold items, then on scroll
  checkReveal();
  window.addEventListener('scroll', checkReveal, { passive: true });

  // ---------- Lightbox ----------
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let galleryImages = [];
  let currentIndex = 0;

  function collectImages() {
    galleryImages = [];
    const selectors = [
      '.timeline-img img',
      '.masonry-item img',
      '.crew-card img',
      '.family-card img',
      '.freshman-hero-img img'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(img => {
        galleryImages.push(img);
      });
    });
  }

  collectImages();

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = galleryImages[currentIndex].src;
    lightboxImg.alt = galleryImages[currentIndex].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentIndex].src;
    lightboxImg.alt = galleryImages[currentIndex].alt;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    lightboxImg.src = galleryImages[currentIndex].src;
    lightboxImg.alt = galleryImages[currentIndex].alt;
  }

  // WHY: Use closest clickable parent so the entire card area is tappable
  galleryImages.forEach((img, i) => {
    const clickTarget = img.closest('.timeline-img, .masonry-item, .crew-card, .family-card, .freshman-hero-img');
    if (clickTarget) {
      clickTarget.addEventListener('click', () => openLightbox(i));
    }
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', showPrev);
  if (lightboxNext) lightboxNext.addEventListener('click', showNext);

  // Close on background click
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  // ---------- Touch swipe for lightbox ----------
  let touchStartX = 0;

  if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      const SWIPE_THRESHOLD = 50; // Minimum px to count as a swipe
      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) showPrev();
        else showNext();
      }
    }, { passive: true });
  }

  // ---------- Nav hide on scroll down, show on scroll up ----------
  let lastScroll = 0;
  const nav = document.querySelector('.nav');

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > lastScroll && currentScroll > 100) {
      nav.style.transform = 'translateY(-100%)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // ---------- Stagger reveal for grid items ----------
  // WHY: Adds a subtle stagger effect when multiple items reveal at once
  const gridContainers = document.querySelectorAll('.crew-gallery, .family-gallery, .facts-grid');
  gridContainers.forEach(container => {
    const items = container.querySelectorAll('.reveal');
    items.forEach((item, i) => {
      item.style.transitionDelay = `${i * 0.07}s`;
    });
  });

})();
