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

// Carrusel alternado (estática <-> combate) pasando de izquierda a derecha cada 1.5 segundos
const carousel = document.getElementById('club-carousel');
const track = document.getElementById('ltr-track');
const prevBtn = document.getElementById('slider-prev');
const nextBtn = document.getElementById('slider-next');
const toggleBtn = document.getElementById('slider-toggle');

if (carousel && track) {
  const slides = Array.from(track.children);
  const totalSlides = slides.length;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentIndex = totalSlides - 1;
  let isPaused = prefersReduced;
  let timer = null;

  function visibleCount() {
    return window.innerWidth >= 720 ? 2 : 1;
  }

  function maxIndex() {
    return Math.max(0, totalSlides - visibleCount());
  }

  function applyPosition(instant = false) {
    const pct = (currentIndex * 100) / visibleCount();
    track.style.transition = instant ? 'none' : '';
    track.style.transform = `translate3d(-${pct}%, 0, 0)`;
  }

  // Avanza de izquierda a derecha (decrementando el desplazamiento negativo para que las fotos entren desde la izquierda hacia la derecha)
  function stepLeftToRight() {
    if (currentIndex <= 0) {
      currentIndex = maxIndex();
    } else {
      currentIndex -= 1;
    }
    applyPosition();
  }

  function stepNext() {
    if (currentIndex >= maxIndex()) {
      currentIndex = 0;
    } else {
      currentIndex += 1;
    }
    applyPosition();
  }

  function startAuto() {
    stopAuto();
    if (!isPaused) {
      timer = window.setInterval(stepLeftToRight, 3000);
    }
  }

  function stopAuto() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function updateToggleUI() {
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-pressed', String(isPaused));
    toggleBtn.setAttribute('aria-label', isPaused ? 'Reanudar carrusel' : 'Pausar carrusel');
    toggleBtn.innerHTML = isPaused
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  }

  currentIndex = maxIndex();
  applyPosition(true);
  updateToggleUI();
  startAuto();

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stepLeftToRight();
      startAuto();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stepNext();
      startAuto();
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      updateToggleUI();
      startAuto();
    });
  }

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);

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
