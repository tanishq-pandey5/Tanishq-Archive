/**
 * Main Application Orchestrator
 * Integrates Scroll Fan Cards, WebGL Chromatic Shader, Gallery & EXIF Lightbox
 */

import { PORTFOLIO_CONFIG, FAN_CARDS_DATA, ALL_PHOTOS_DATA } from './portfolio-data.js';
import { ScrollFanCards } from './fan-cards.js';
import { ChromaticShaderBackground } from './shader.js';

class PortfolioApp {
  constructor() {
    this.currentCategory = 'All';
    this.currentLayout = 'grid';
    this.activePhotoIndex = 0;
    this.filteredPhotos = [...ALL_PHOTOS_DATA];
    
    // Components
    this.fanEngine = null;
    this.shaderEngine = null;

    // DOM Elements
    this.galleryGrid = document.getElementById('gallery-grid');
    this.filterContainer = document.getElementById('filter-pills');
    this.lightbox = document.getElementById('lightbox-modal');
    this.inquiryModal = document.getElementById('inquiry-modal');
    
    this.init();
  }

  init() {
    this.initShader();
    this.initFanCards();
    this.initMobileNav();
    this.initGalleryFilters();
    this.renderGallery();
    this.initLightbox();
    this.initInquiryModal();
    this.setupScrollSync();
    this.setupDeckControls();
  }

  initShader() {
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
      try {
        this.shaderEngine = new ChromaticShaderBackground(canvas);
      } catch (err) {
        console.warn("Shader init bypassed:", err);
      }
    }
  }

  initFanCards() {
    const fanContainer = document.getElementById('fan-cards-container');
    if (fanContainer) {
      this.fanEngine = new ScrollFanCards(fanContainer, FAN_CARDS_DATA, (cardData, index) => {
        // Open card in lightbox
        const globalIdx = ALL_PHOTOS_DATA.findIndex(p => p.id === cardData.id);
        this.openLightbox(globalIdx >= 0 ? globalIdx : 0);
      });
    }
  }

  initMobileNav() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-drawer');
    if (!toggleBtn || !drawer) return;

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('active');
      toggleBtn.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('active');
        toggleBtn.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  setupScrollSync() {
    const heroTrack = document.getElementById('hero-track');
    const scrubSlider = document.getElementById('scrub-slider');

    const handleScroll = () => {
      if (!heroTrack || !this.fanEngine) return;
      const rect = heroTrack.getBoundingClientRect();
      const totalScrollable = heroTrack.offsetHeight - window.innerHeight;
      
      // Calculate scroll progress through hero section [0.0 to 1.5]
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(2.0, scrolled / totalScrollable));

      if (rect.top <= 0 && rect.bottom >= 0) {
        this.fanEngine.setProgress(progress);
        if (scrubSlider && !this.isScrubbing) {
          scrubSlider.value = Math.min(1, progress);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  setupDeckControls() {
    const scrubSlider = document.getElementById('scrub-slider');
    const fanToggleBtn = document.getElementById('btn-fan-toggle');
    const autoSpinBtn = document.getElementById('btn-auto-spin');
    const shaderToggleBtn = document.getElementById('btn-shader-toggle');

    if (scrubSlider) {
      scrubSlider.addEventListener('input', (e) => {
        this.isScrubbing = true;
        const val = parseFloat(e.target.value);
        if (this.fanEngine) this.fanEngine.setProgress(val);
      });
      scrubSlider.addEventListener('change', () => {
        this.isScrubbing = false;
      });
    }

    if (fanToggleBtn) {
      let isFanned = false;
      fanToggleBtn.addEventListener('click', () => {
        isFanned = !isFanned;
        if (this.fanEngine) {
          this.fanEngine.setProgress(isFanned ? 1.0 : 0.0);
          fanToggleBtn.classList.toggle('active', isFanned);
          if (scrubSlider) scrubSlider.value = isFanned ? 1.0 : 0.0;
        }
      });
    }

    if (autoSpinBtn) {
      autoSpinBtn.addEventListener('click', () => {
        if (this.fanEngine) {
          const spinning = this.fanEngine.toggleAutoRotate();
          autoSpinBtn.classList.toggle('active', spinning);
        }
      });
    }

    if (shaderToggleBtn && this.shaderEngine) {
      let shaderOn = true;
      shaderToggleBtn.addEventListener('click', () => {
        shaderOn = !shaderOn;
        this.shaderEngine.isActive = shaderOn;
        const canvas = document.getElementById('bg-canvas');
        if (canvas) canvas.style.opacity = shaderOn ? '0.65' : '0';
        shaderToggleBtn.classList.toggle('active', shaderOn);
      });
    }

    // Layout buttons
    const layoutBtns = document.querySelectorAll('.layout-btn');
    layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        layoutBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLayout = btn.dataset.layout;
        this.updateGalleryLayout();
      });
    });
  }

  initGalleryFilters() {
    const categories = ['All', 'Editorial', 'Street & Nocturne', 'Architecture & Form', 'Nature & Landscape', 'Analog & Film'];
    if (!this.filterContainer) return;

    this.filterContainer.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `filter-pill ${cat === 'All' ? 'active' : ''}`;
      
      const count = cat === 'All' ? ALL_PHOTOS_DATA.length : ALL_PHOTOS_DATA.filter(p => p.category === cat).length;
      btn.innerHTML = `${cat} <span>(${count})</span>`;
      
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = cat;
        this.applyFilter();
      });

      this.filterContainer.appendChild(btn);
    });
  }

  applyFilter() {
    if (this.currentCategory === 'All') {
      this.filteredPhotos = [...ALL_PHOTOS_DATA];
    } else {
      this.filteredPhotos = ALL_PHOTOS_DATA.filter(p => p.category === this.currentCategory);
    }
    this.renderGallery();
  }

  updateGalleryLayout() {
    if (!this.galleryGrid) return;
    this.galleryGrid.className = `gallery-grid ${this.currentLayout}`;
  }

  renderGallery() {
    if (!this.galleryGrid) return;
    this.galleryGrid.innerHTML = '';

    this.filteredPhotos.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.dataset.index = index;

      const isPortrait = item.id % 3 === 0;

      card.innerHTML = `
        <div class="gallery-card-img-wrap ${isPortrait ? 'portrait' : ''}">
          <img src="${item.thumb || item.image}" alt="${item.title}" loading="lazy" />
          <div class="gallery-card-overlay"></div>
        </div>
        <div class="gallery-card-info">
          <div class="card-title-row">
            <h4 class="card-title">${item.title}</h4>
            <span class="card-category">${item.category}</span>
          </div>
          <div class="card-exif-chips">
            <span class="exif-chip">${item.exif.camera || 'Camera'}</span>
            <span class="exif-chip">${item.exif.aperture || 'f/1.8'}</span>
            <span class="exif-chip">${item.exif.shutter || '1/500s'}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        const globalIdx = ALL_PHOTOS_DATA.findIndex(p => p.id === item.id);
        this.openLightbox(globalIdx >= 0 ? globalIdx : index);
      });

      this.galleryGrid.appendChild(card);
    });
  }

  /* Fullscreen EXIF Lightbox */
  initLightbox() {
    if (!this.lightbox) return;

    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeLightbox());
    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateLightbox(1));

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) this.closeLightbox();
    });

    window.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
      if (e.key === 'ArrowRight') this.navigateLightbox(1);
    });

    // Touch swipe gestures for mobile phones & tablets
    let touchStartX = 0;
    let touchStartY = 0;
    this.lightbox.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.lightbox.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            this.navigateLightbox(-1); // swipe right -> previous photo
          } else {
            this.navigateLightbox(1);  // swipe left -> next photo
          }
        }
      }
    }, { passive: true });
  }

  openLightbox(index) {
    if (!this.lightbox || index < 0 || index >= ALL_PHOTOS_DATA.length) return;
    this.activePhotoIndex = index;
    const photo = ALL_PHOTOS_DATA[index];

    const imgEl = document.getElementById('lightbox-img');
    const titleEl = document.getElementById('lightbox-title');
    const catEl = document.getElementById('lightbox-category');
    
    // EXIF elements
    const camEl = document.getElementById('exif-camera');
    const focalEl = document.getElementById('exif-focal');
    const aptEl = document.getElementById('exif-aperture');
    const shtEl = document.getElementById('exif-shutter');
    const isoEl = document.getElementById('exif-iso');
    const dateEl = document.getElementById('exif-date');

    if (imgEl) imgEl.src = photo.image;
    if (titleEl) titleEl.textContent = photo.title;
    if (catEl) catEl.textContent = `${photo.category} · Ref #0${photo.id}`;

    if (camEl) camEl.textContent = photo.exif.camera || 'Pro System';
    if (focalEl) focalEl.textContent = photo.exif.focal || '24mm eq.';
    if (aptEl) aptEl.textContent = photo.exif.aperture || 'f/1.8';
    if (shtEl) shtEl.textContent = photo.exif.shutter || '1/500s';
    if (isoEl) isoEl.textContent = photo.exif.iso || 'ISO 100';
    if (dateEl) dateEl.textContent = photo.exif.date || '2025';

    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    if (!this.lightbox) return;
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  navigateLightbox(dir) {
    const total = ALL_PHOTOS_DATA.length;
    let nextIdx = (this.activePhotoIndex + dir) % total;
    if (nextIdx < 0) nextIdx = total - 1;
    this.openLightbox(nextIdx);
  }

  /* Booking & Inquiry Modal */
  initInquiryModal() {
    const openBtns = document.querySelectorAll('.open-inquiry-btn');
    const closeBtn = document.getElementById('inquiry-close');
    const form = document.getElementById('inquiry-form');

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.inquiryModal) this.inquiryModal.classList.add('active');
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.inquiryModal) this.inquiryModal.classList.remove('active');
      });
    }

    if (this.inquiryModal) {
      this.inquiryModal.addEventListener('click', (e) => {
        if (e.target === this.inquiryModal) this.inquiryModal.classList.remove('active');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for reaching out! I will get back to you soon.');
        this.inquiryModal.classList.remove('active');
        form.reset();
      });
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PortfolioApp();
});
