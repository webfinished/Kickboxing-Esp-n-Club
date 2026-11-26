const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute(
      'aria-label',
      isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
    );
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });
}

// Galería: vídeo primero (permanece hasta terminar) y fotos cada 3 s con desplazamiento lateral suave
const carousel = document.getElementById('club-carousel');
const track = document.getElementById('ltr-track');
const prevBtn = document.getElementById('slider-prev');
const nextBtn = document.getElementById('slider-next');
const toggleBtn = document.getElementById('slider-toggle');
const galleryVideo = document.getElementById('club-gallery-video');

if (carousel && track) {
  const slides = Array.from(track.children);
  const totalSlides = slides.length;
  const videoSlideIndex = galleryVideo
    ? slides.findIndex((slide) => slide.contains(galleryVideo))
    : -1;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentIndex = 0;
  let isPaused = prefersReduced;
  let isHovered = false;
  let timer = null;

  function visibleCount() {
    return window.innerWidth >= 720 ? 2 : 1;
  }

  function maxIndex() {
    return Math.max(0, totalSlides - visibleCount());
  }

  function clearSlideTimer() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function applyPosition(instant = false) {
    const pct = (currentIndex * 100) / visibleCount();
    track.style.transition = instant ? 'none' : '';
    track.style.transform = `translate3d(-${pct}%, 0, 0)`;
  }

  function isOnVideoSlide() {
    return galleryVideo && videoSlideIndex >= 0 && currentIndex === videoSlideIndex;
  }

  function scheduleNext() {
    clearSlideTimer();
    if (isPaused || isHovered) return;

    // Cuando el vídeo está activo, permanece ahí hasta que acabe
    if (isOnVideoSlide()) {
      const playPromise = galleryVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Respaldo si el navegador bloquea la reproducción automática
          timer = window.setTimeout(stepForward, 3000);
        });
      }
      return;
    }

    // Resto de fotos: avanzan cada 3 segundos
    timer = window.setTimeout(stepForward, 3000);
  }

  function syncVideoForSlide(resetToStart = false) {
    if (!galleryVideo) return;
    if (isOnVideoSlide()) {
      if (resetToStart) {
        try {
          galleryVideo.currentTime = 0;
        } catch {
          // Ignorar si aún no cargaron metadatos
        }
      }
      if (!isPaused && !isHovered) {
        galleryVideo.play().catch(() => {});
      }
    } else {
      galleryVideo.pause();
    }
  }

  function stepForward() {
    if (currentIndex >= maxIndex()) {
      currentIndex = 0;
    } else {
      currentIndex += 1;
    }
    applyPosition();
    syncVideoForSlide(true);
    scheduleNext();
  }

  function stepBack() {
    if (currentIndex <= 0) {
      currentIndex = maxIndex();
    } else {
      currentIndex -= 1;
    }
    applyPosition();
    syncVideoForSlide(true);
    scheduleNext();
  }

  function updateToggleUI() {
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-pressed', String(isPaused));
    toggleBtn.setAttribute('aria-label', isPaused ? 'Reanudar carrusel' : 'Pausar carrusel');
    toggleBtn.innerHTML = isPaused
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  }

  if (galleryVideo) {
    galleryVideo.addEventListener('ended', () => {
      if (isOnVideoSlide() && !isPaused && !isHovered) {
        stepForward();
      }
    });
  }

  currentIndex = 0;
  applyPosition(true);
  updateToggleUI();
  syncVideoForSlide(true);
  scheduleNext();

  if (galleryVideo && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isOnVideoSlide() && !isPaused && !isHovered) {
            if (galleryVideo.paused) {
              galleryVideo.play().catch(() => {});
            }
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(carousel);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stepBack();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stepForward();
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      updateToggleUI();
      if (isPaused) {
        clearSlideTimer();
        if (galleryVideo) galleryVideo.pause();
      } else {
        syncVideoForSlide(false);
        scheduleNext();
      }
    });
  }

  carousel.addEventListener('mouseenter', () => {
    isHovered = true;
    clearSlideTimer();
    if (galleryVideo && isOnVideoSlide()) galleryVideo.pause();
  });

  carousel.addEventListener('mouseleave', () => {
    isHovered = false;
    if (!isPaused) {
      syncVideoForSlide(false);
      scheduleNext();
    }
  });

  window.addEventListener('resize', () => {
    if (currentIndex > maxIndex()) {
      currentIndex = maxIndex();
    }
    applyPosition(true);
  });
}

// Carga dinámica de reseñas de Google desde data/reviews.json (actualizado por GitHub Actions)
(async function loadGoogleReviews() {
  const heading = document.getElementById('reviews-heading');
  const starsContainer = document.getElementById('reviews-stars');
  const marqueeTrack = document.getElementById('reviews-marquee-track');
  if (!heading || !starsContainer || !marqueeTrack) return;

  try {
    const res = await fetch('data/reviews.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();

    if (typeof data.rating === 'number' && Number.isFinite(data.rating)) {
      const formatted = data.rating.toFixed(1).replace('.', ',');
      heading.textContent = `Reseñas en Google (${formatted} / 5)`;

      const starPoints =
        '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';
      starsContainer.innerHTML = Array.from({ length: 5 }, (_, idx) => {
        const fillPct = Math.max(0, Math.min(1, data.rating - idx)) * 100;
        if (fillPct >= 99) {
          return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="${starPoints}" /></svg>`;
        }
        const gradId = `star-fill-dyn-${idx}`;
        return `<svg width="16" height="16" viewBox="0 0 24 24"><defs><linearGradient id="${gradId}"><stop offset="${fillPct.toFixed(0)}%" stop-color="currentColor" /><stop offset="${fillPct.toFixed(0)}%" stop-color="#D4D4D8" /></linearGradient></defs><polygon fill="url(#${gradId})" points="${starPoints}" /></svg>`;
      }).join('');
    }

    if (Array.isArray(data.reviews) && data.reviews.length > 0) {
      const sorted = [...data.reviews]
        .filter((r) => r && typeof r.text === 'string' && r.text.trim().length > 0)
        .sort((a, b) => b.text.length - a.text.length);

      if (sorted.length > 0) {
        const buildGroup = (isClone) => {
          const group = document.createElement('div');
          group.className = 'marquee-group';
          if (isClone) group.setAttribute('aria-hidden', 'true');

          sorted.forEach((item) => {
            const card = document.createElement('blockquote');
            card.className = 'ticker-card';

            const p = document.createElement('p');
            p.textContent = `«${item.text.trim()}»`;

            const footer = document.createElement('footer');
            footer.textContent = `${item.author || 'Alumno del club'} · Reseña en Google`;

            card.append(p, footer);
            group.appendChild(card);
          });
          return group;
        };

        marqueeTrack.replaceChildren(buildGroup(false), buildGroup(true));
      }
    }
  } catch {
    // En apertura local sin servidor (file://), se mantiene el HTML estático de respaldo
  }
})();
