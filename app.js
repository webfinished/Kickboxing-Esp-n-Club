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
