// ============================================
// Gallery — MorrowMark API (replaces Firebase/Firestore)
// ============================================
//
// WHY: Migrated from Firebase to MorrowMark's gallery API which enforces
// privacy at the server level. Firebase had `read: if true` on Firestore
// rules — anyone could query all photos. MorrowMark checks is_public,
// media_visibility_paused, and privacy_wall before serving.
//
// The API returns secure serve URLs (/api/media/serve/[id]) that redirect
// to short-lived presigned S3 URLs instead of permanent public URLs.

// WHY: "parker" — this site shows only photos tagged for Parker's member profile.
const SITE_ID = 'parker';

// WHY: MorrowMark API base URL — hosted on EC2 (34.195.167.131) via app.morrowmark.com.
// gutierrez-rose is the family's public_slug in the families table.
const API_BASE = 'https://app.morrowmark.com/api/sites/gutierrez-rose/gallery';

const galleryGrid = document.getElementById('firestoreGalleryGrid');
const galleryContainer = document.querySelector('.fs-gallery-container');
const feedEmpty = document.getElementById('firestoreFeedEmpty');
const feedLoading = document.getElementById('firestoreFeedLoading');
const categoryTabs = document.getElementById('firestoreCategoryTabs');
const gallerySearch = document.getElementById('firestoreGallerySearch');
const lightbox = document.getElementById('firestoreLightbox');
const lightboxImg = document.getElementById('firestoreLightboxImg');
const lightboxMeta = document.getElementById('firestoreLightboxMeta');
const lightboxClose = document.getElementById('firestoreLightboxClose');
const lightboxPrev = document.getElementById('firestoreLightboxPrev');
const lightboxNext = document.getElementById('firestoreLightboxNext');

let allPhotos = [];
let filteredPhotos = [];
let categories = [];
let activeCategory = '';
let searchTerm = '';
let lightboxIndex = -1;
let galleryExpanded = false;

// -------------------------------------------
// Load photos from MorrowMark API
// -------------------------------------------
async function loadPhotos() {
  try {
    const res = await fetch(`${API_BASE}?site=${SITE_ID}&limit=200`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const data = await res.json();

    if (feedLoading) feedLoading.style.display = 'none';

    if (!data.photos || data.photos.length === 0) {
      if (feedEmpty) feedEmpty.style.display = 'block';
      return;
    }

    allPhotos = data.photos;
    categories = data.categories || [];

    // WHY: Build category tabs dynamically from API response
    if (categoryTabs && categories.length > 0) {
      buildCategoryTabs(categories);
    }

    // WHY: Don't render on load — gallery starts collapsed, photos load silently in background
  } catch (err) {
    console.error('Error loading photos:', err);
    if (feedLoading) feedLoading.style.display = 'none';
    if (feedEmpty) feedEmpty.style.display = 'block';
  }
}

// -------------------------------------------
// Build category filter tabs from API data
// -------------------------------------------
function buildCategoryTabs(cats) {
  if (!categoryTabs) return;

  const existingButtons = categoryTabs.querySelectorAll('.fs-filter-btn[data-filter]');
  const existingFilters = new Set();
  existingButtons.forEach((btn) => existingFilters.add(btn.dataset.filter));

  cats.forEach((cat) => {
    if (existingFilters.has(cat)) return;
    const btn = document.createElement('button');
    btn.className = 'fs-filter-btn';
    btn.dataset.filter = cat;
    btn.textContent = cat;
    categoryTabs.appendChild(btn);
  });
}

// -------------------------------------------
// Filter + Search
// -------------------------------------------
function applyFilters() {
  const term = searchTerm.toLowerCase();
  filteredPhotos = allPhotos.filter((photo) => {
    if (activeCategory && photo.category !== activeCategory) return false;
    if (term) {
      const searchable = [
        photo.caption,
        photo.category,
        ...(photo.tags || []),
        ...(photo.people || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(term)) return false;
    }
    return true;
  });
  renderGallery();
}

// WHY: Gallery starts collapsed — clicking a category expands it, clicking active category collapses it
function expandGallery() {
  galleryExpanded = true;
  if (galleryContainer) galleryContainer.classList.add('gallery-expanded');
  if (gallerySearch) gallerySearch.style.display = '';
}

function collapseGallery() {
  galleryExpanded = false;
  if (galleryContainer) galleryContainer.classList.remove('gallery-expanded');
  if (galleryGrid) galleryGrid.innerHTML = '';
  if (feedEmpty) feedEmpty.style.display = 'none';
  if (gallerySearch) gallerySearch.style.display = 'none';
}

if (categoryTabs) {
  categoryTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.fs-filter-btn');
    if (!tab) return;

    const clickedFilter = tab.dataset.filter === 'all' ? '' : tab.dataset.filter;

    // If clicking the already-active filter while expanded, collapse
    if (clickedFilter === activeCategory && galleryExpanded) {
      categoryTabs.querySelectorAll('.fs-filter-btn').forEach(t => t.classList.remove('active'));
      activeCategory = '';
      collapseGallery();
      return;
    }

    categoryTabs.querySelectorAll('.fs-filter-btn').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = clickedFilter;
    expandGallery();
    applyFilters();
  });
}

if (gallerySearch) {
  let searchTimeout;
  gallerySearch.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTerm = gallerySearch.value.trim();
      applyFilters();
    }, 300);
  });
  // WHY: Gallery starts collapsed — search bar hidden until a category is selected
  gallerySearch.style.display = 'none';
}

// -------------------------------------------
// Render gallery grid
// -------------------------------------------
function renderGallery() {
  galleryGrid.innerHTML = '';

  if (filteredPhotos.length === 0 && allPhotos.length > 0) {
    galleryGrid.innerHTML = '<p class="fs-gallery-no-results">No photos match your search.</p>';
    return;
  }
  if (filteredPhotos.length === 0) {
    if (feedEmpty) feedEmpty.style.display = 'block';
    return;
  }

  if (feedEmpty) feedEmpty.style.display = 'none';

  filteredPhotos.forEach((photo, index) => {
    // WHY: MorrowMark API returns secure serve URLs — use directly
    const thumbUrl = photo.url;

    const card = document.createElement('article');
    card.className = 'fs-gallery-card';
    card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;

    const categoryBadge = photo.category
      ? `<span class="fs-gallery-card-category">${esc(photo.category)}</span>`
      : '';

    const peoplePills = (photo.people || []).length > 0
      ? `<div class="fs-gallery-card-people">${photo.people.map(p => `<span class="fs-gallery-card-person">${esc(p)}</span>`).join('')}</div>`
      : '';

    card.innerHTML = `
      <div class="fs-gallery-card-image">
        <img src="${esc(thumbUrl)}" alt="${esc(photo.caption || 'Photo')}" loading="lazy">
        ${categoryBadge}
      </div>
      ${photo.caption ? `<p class="fs-gallery-card-caption">${esc(photo.caption)}</p>` : ''}
      ${peoplePills}
    `;

    card.addEventListener('click', () => openLightbox(index));
    galleryGrid.appendChild(card);
  });
}

// -------------------------------------------
// Lightbox
// -------------------------------------------
function openLightbox(index) {
  lightboxIndex = index;
  updateLightbox();
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.style.display = 'none';
  document.body.style.overflow = '';
  lightboxIndex = -1;
}

function updateLightbox() {
  if (lightboxIndex < 0 || lightboxIndex >= filteredPhotos.length) return;
  const photo = filteredPhotos[lightboxIndex];
  // WHY: MorrowMark serve URLs work for full-size images too
  lightboxImg.src = photo.url;
  lightboxImg.alt = photo.caption || 'Photo';

  const date = photo.date
    ? new Date(photo.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const peopleLine = (photo.people || []).length > 0
    ? `<span class="fs-lightbox-people">${photo.people.map(p => esc(p)).join(', ')}</span>`
    : '';

  lightboxMeta.innerHTML = `
    ${photo.caption ? `<p class="fs-lightbox-caption">${esc(photo.caption)}</p>` : ''}
    <div class="fs-lightbox-details">
      ${date ? `<span>${date}</span>` : ''}
      ${photo.category ? `<span>${esc(photo.category)}</span>` : ''}
      ${peopleLine}
    </div>
  `;

  lightboxPrev.style.visibility = lightboxIndex > 0 ? 'visible' : 'hidden';
  lightboxNext.style.visibility = lightboxIndex < filteredPhotos.length - 1 ? 'visible' : 'hidden';
}

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxPrev) lightboxPrev.addEventListener('click', () => {
  if (lightboxIndex > 0) { lightboxIndex--; updateLightbox(); }
});
if (lightboxNext) lightboxNext.addEventListener('click', () => {
  if (lightboxIndex < filteredPhotos.length - 1) { lightboxIndex++; updateLightbox(); }
});
if (lightbox) lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox || lightbox.style.display === 'none') return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft' && lightboxIndex > 0) { lightboxIndex--; updateLightbox(); }
  if (e.key === 'ArrowRight' && lightboxIndex < filteredPhotos.length - 1) { lightboxIndex++; updateLightbox(); }
});

// -------------------------------------------
// XSS prevention
// -------------------------------------------
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// -------------------------------------------
// Init
// -------------------------------------------
loadPhotos();
