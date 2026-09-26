/**
 * Scroll Fan Cards Interactive Engine
 * Based on Framer radial aperture deck mathematics:
 * angle(i, total) = -60deg + (360deg / total) * i
 * transformOrigin: 'left bottom'
 * Interpolates from stacked deck (progress 0) to full radial fan (progress 1) with continuous rotation
 */

export class ScrollFanCards {
  constructor(containerEl, cardsData, onCardClick) {
    this.container = containerEl;
    this.cardsData = cardsData;
    this.onCardClick = onCardClick;
    this.total = cardsData.length;
    
    // Physics and state
    this.progress = 0;
    this.targetProgress = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartProgress = 0;
    this.autoRotate = false;
    this.autoRotateSpeed = 0.0015;
    
    // DOM references
    this.pivot = null;
    this.cardElements = [];
    this.badgeEl = null;
    
    // Card dimensions
    this.cardW = 280;
    this.cardH = 176;
    this.cardRadius = 14;
    this.initialAngle = 0;
    this.stackedOffset = this.calculateStackedOffset(this.initialAngle, this.cardW, this.cardH);
    
    this.init();
  }

  calculateStackedOffset(angle, w, h) {
    const r = (angle * Math.PI) / 180;
    const i = w / 2;
    const a = -h / 2;
    return {
      x: -(i * Math.cos(r) - a * Math.sin(r)),
      y: -(i * Math.sin(r) + a * Math.cos(r))
    };
  }

  init() {
    this.container.innerHTML = '';
    this.container.classList.add('fan-cards-wrapper');

    // Create central pivot
    this.pivot = document.createElement('div');
    this.pivot.className = 'fan-cards-pivot';
    this.container.appendChild(this.pivot);

    // Floating tooltip badge for hovered card
    this.badgeEl = document.createElement('div');
    this.badgeEl.className = 'fan-card-hover-badge';
    this.container.appendChild(this.badgeEl);

    // Build cards
    this.cardsData.forEach((data, index) => {
      const card = document.createElement('div');
      card.className = 'fan-card';
      card.dataset.index = index;
      card.style.width = `${this.cardW}px`;
      card.style.height = `${this.cardH}px`;
      card.style.zIndex = this.total - index;

      card.innerHTML = `
        <div class="fan-card-inner">
          <img src="${data.thumb || data.image}" alt="${data.title}" loading="eager" draggable="false" />
          <div class="fan-card-glass"></div>
          <div class="fan-card-border"></div>
          <div class="fan-card-info-peek">
            <span class="fan-card-num">0${index + 1}</span>
            <span class="fan-card-title">${data.title}</span>
          </div>
        </div>
      `;

      // Hover events
      card.addEventListener('mouseenter', (e) => this.handleCardHover(e, data, index));
      card.addEventListener('mouseleave', () => this.handleCardLeave());
      card.addEventListener('click', () => {
        if (!this.hasDragged) {
          if (this.onCardClick) this.onCardClick(data, index);
        }
      });

      this.pivot.appendChild(card);
      this.cardElements.push(card);
    });

    // Touch & Drag events on the fan container
    this.setupInteractivity();

    // Start render loop
    this.animate();
  }

  setupInteractivity() {
    let startX = 0;
    let startY = 0;
    this.hasDragged = false;

    const onPointerDown = (e) => {
      this.isDragging = true;
      this.hasDragged = false;
      this.dragStartX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      this.dragStartY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      this.dragStartProgress = this.targetProgress;
      this.autoRotate = false;
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const deltaX = clientX - this.dragStartX;
      const deltaY = clientY - this.dragStartY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        this.hasDragged = true;
      }

      // Drag horizontally to rotate / spread the fan
      const sensitivity = 0.0035;
      this.targetProgress = this.dragStartProgress + deltaX * sensitivity;
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Responsive resize handler
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
  }

  handleResize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Base 16:10 card dimensions
    const baseW = 280;
    const baseH = 176;
    const diagonal = Math.sqrt(baseW * baseW + baseH * baseH);
    
    // Calculate allowable fan diameter based on device screen constraints
    // Ensures the 360-degree fan never overflows phone edges or clips vertically
    let widthRatio = 0.86;
    let heightRatio = 0.58;
    
    if (vw < 480) {
      // Small to standard smartphones
      widthRatio = 0.88;
      heightRatio = 0.44;
    } else if (vw < 768) {
      // Large smartphones & small tablets
      widthRatio = 0.84;
      heightRatio = 0.48;
    } else if (vw < 1024) {
      // Tablets (iPad mini / air / pro portrait)
      widthRatio = 0.82;
      heightRatio = 0.54;
    } else if (vw < 1440) {
      // Laptops (13" to 15" screens, e.g. MacBook Air / Pro)
      widthRatio = 0.80;
      heightRatio = 0.56;
    } else {
      // Large external displays & desktops
      widthRatio = 0.75;
      heightRatio = 0.60;
    }

    const maxDiameter = Math.min(vw * widthRatio, vh * heightRatio);
    // Scale factor constrained between 0.45 (small phones) and 1.15 (large monitors)
    const scale = Math.min(1.15, Math.max(0.45, maxDiameter / (diagonal * 1.82)));

    this.cardW = Math.round(baseW * scale);
    this.cardH = Math.round(baseH * scale);

    this.stackedOffset = this.calculateStackedOffset(this.initialAngle, this.cardW, this.cardH);
    this.cardElements.forEach(card => {
      card.style.width = `${this.cardW}px`;
      card.style.height = `${this.cardH}px`;
    });
  }

  handleCardHover(e, data, index) {
    if (this.badgeEl) {
      this.badgeEl.innerHTML = `
        <div class="badge-title">${data.title}</div>
        <div class="badge-meta">${data.category} · ${data.exif.camera || 'Photo'}</div>
      `;
      this.badgeEl.classList.add('visible');
    }
  }

  handleCardLeave() {
    if (this.badgeEl) {
      this.badgeEl.classList.remove('visible');
    }
  }

  setProgress(p) {
    this.targetProgress = p;
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  animate() {
    // Lerp progress smoothly
    if (this.autoRotate) {
      this.targetProgress += this.autoRotateSpeed;
    }

    const ease = 0.085;
    this.progress += (this.targetProgress - this.progress) * ease;

    // Calculate clamped spread factor (0 = stacked, 1 = fully open circular fan)
    const spreadFactor = Math.min(1, Math.max(0, this.progress));
    
    // Additional continuous rotation as user scrolls or drags further
    const continuousRot = (this.progress - spreadFactor) * 360;

    // Interpolate pivot translation
    const curX = this.stackedOffset.x * (1 - spreadFactor);
    const curY = this.stackedOffset.y * (1 - spreadFactor);
    this.pivot.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;

    // Interpolate card rotations
    const total = this.total;
    for (let i = 0; i < total; i++) {
      const card = this.cardElements[i];
      // Target angular distribution: -60 + (360 / total) * i
      const targetFanAngle = -60 + (360 / total) * i;
      const angle = (targetFanAngle * spreadFactor) + continuousRot;
      
      card.style.transform = `rotate(${angle}deg)`;
    }

    requestAnimationFrame(() => this.animate());
  }
}
