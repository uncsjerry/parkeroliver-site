/* ==========================================================================
   Parker Oliver — parkeroliver.com
   Main JavaScript — VOGUE editorial interactions
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
  function checkReveal() {
    const triggerBottom = window.innerHeight * 0.88;
    // WHY: Re-query each time in case elements were added dynamically
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < triggerBottom) {
        el.classList.add('visible');
      }
    });
  }

  checkReveal();
  window.addEventListener('scroll', checkReveal, { passive: true });

  // ---------- Nav: hide on scroll down, show on scroll up, swap bg past hero ----------
  let lastScroll = 0;
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    // Hide/show nav on scroll direction
    if (currentScroll > lastScroll && currentScroll > 100) {
      nav.style.transform = 'translateY(-100%)';
    } else {
      nav.style.transform = 'translateY(0)';
    }

    // WHY: Switch nav from transparent-over-hero to solid-over-content
    if (hero) {
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      if (currentScroll > heroBottom - 60) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // ---------- Animated counters ----------
  // WHY: Counts up from 0 to target value when element enters viewport (like Mac's stat counters)
  const counters = document.querySelectorAll('[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;

      const duration = 1500; // ms to count up — matches editorial pacing
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        // WHY: Cubic ease-out makes the counter decelerate naturally
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));

  // ---------- Polaroid shuffle — random rotation ----------
  // WHY: Gives polaroids a scattered-on-table look, like Mac's friend cards
  const polaroids = document.querySelectorAll('.polaroid-card');
  function shufflePolaroids() {
    polaroids.forEach(card => {
      const rotation = (Math.random() - 0.5) * 10; // -5 to +5 degrees
      card.style.transform = `rotate(${rotation}deg)`;
    });
  }
  shufflePolaroids();

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
      '.world-card img',
      '.polaroid-frame img',
      '.family-card img',
      '.freshman-img img',
      '.meet-image img'
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
    const clickTarget = img.closest('.timeline-img, .world-card, .polaroid-card, .family-card, .freshman-img, .meet-image');
    if (clickTarget) {
      clickTarget.addEventListener('click', () => openLightbox(i));
    }
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', showPrev);
  if (lightboxNext) lightboxNext.addEventListener('click', showNext);

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
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

  // ---------- Stagger reveal for grid items ----------
  // WHY: Adds a subtle stagger effect when multiple items reveal at once
  const gridContainers = document.querySelectorAll('.polaroid-gallery, .family-gallery, .facts-grid, .world-grid');
  gridContainers.forEach(container => {
    const items = container.querySelectorAll('.reveal');
    items.forEach((item, i) => {
      item.style.transitionDelay = `${i * 0.05}s`;
    });
  });

})();
