// ============================================
// Gallery — Parker Oliver Site (reads from shared Firestore)
// ============================================

import { db } from './firebase-config.js';
import {
  collection, query, where, orderBy, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// WHY: "parker" visibility tag — this site shows only photos tagged for Parker
const SITE_ID = 'parker';

const galleryGrid = document.getElementById('firestoreGalleryGrid');
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
let activeCategory = '';
let searchTerm = '';
let lightboxIndex = -1;

// -------------------------------------------
// Load photos — filtered by visibility + status
// -------------------------------------------
async function loadPhotos() {
  try {
    const q = query(
      collection(db, 'photos'),
      where('status', '==', 'approved'),
      where('visibility', 'array-contains', SITE_ID),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    if (feedLoading) feedLoading.style.display = 'none';

    if (snapshot.empty) {
      if (feedEmpty) feedEmpty.style.display = 'block';
      return;
    }

    allPhotos = [];
    snapshot.forEach((doc) => {
      allPhotos.push({ id: doc.id, ...doc.data() });
    });

    applyFilters();
  } catch (err) {
    console.error('Error loading photos:', err);
    if (feedLoading) feedLoading.style.display = 'none';
    if (feedEmpty) feedEmpty.style.display = 'block';
  }
}

// -------------------------------------------
// Filter + Search
// -------------------------------------------
function applyFilters() {
  const term = searchTerm.toLowerCase();
  filteredPhotos = allPhotos.filter(photo => {
    if (activeCategory && photo.category !== activeCategory) return false;
    if (term) {
      const searchable = [
        photo.caption, photo.location, photo.driveName,
        ...(photo.tags || []), ...(photo.people || [])
      ].join(' ').toLowerCase();
      if (!searchable.includes(term)) return false;
    }
    return true;
  });
  renderGallery();
}

if (categoryTabs) {
  categoryTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.fs-filter-btn');
    if (!tab) return;
    categoryTabs.querySelectorAll('.fs-filter-btn').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.filter === 'all' ? '' : tab.dataset.filter;
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
    const thumbUrl = `https://lh3.googleusercontent.com/d/${photo.driveFileId}=w600`;

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
        <img src="${esc(thumbUrl)}" alt="${esc(photo.caption || photo.driveName || 'Photo')}" loading="lazy">
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
  lightboxImg.src = `https://lh3.googleusercontent.com/d/${photo.driveFileId}=w1600`;
  lightboxImg.alt = photo.caption || photo.driveName || 'Photo';

  const date = photo.publishedAt
    ? photo.publishedAt.toDate().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : '';

  const peopleLine = (photo.people || []).length > 0
    ? `<span class="fs-lightbox-people">${photo.people.map(p => esc(p)).join(', ')}</span>`
    : '';

  lightboxMeta.innerHTML = `
    ${photo.caption ? `<p class="fs-lightbox-caption">${esc(photo.caption)}</p>` : ''}
    <div class="fs-lightbox-details">
      ${photo.location ? `<span>${esc(photo.location)}</span>` : ''}
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
