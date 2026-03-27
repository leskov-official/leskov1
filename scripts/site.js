(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  const menuToggle = $('[data-menu-toggle]');
  const nav = $('#site-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuToggle.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    $$('[data-nav-link]').forEach((link) => {
      link.addEventListener('click', () => {
        document.body.classList.remove('menu-open');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const sections = ['home', 'shop', 'music', 'news', 'biography', 'gallery']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = $$('[data-nav-link]');
  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  const revealItems = $$('.reveal');
  if (revealItems.length) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const cookieBanner = $('[data-cookie-banner]');
  const cookieAccept = $('[data-cookie-accept]');
  if (cookieBanner && cookieAccept) {
    const accepted = localStorage.getItem('leskov-cookie-consent');
    if (!accepted) cookieBanner.hidden = false;
    cookieAccept.addEventListener('click', () => {
      localStorage.setItem('leskov-cookie-consent', 'accepted');
      cookieBanner.hidden = true;
    });
  }

  const searchInput = $('[data-track-search]');
  const trackCards = $$('[data-track-card]');
  const emptyState = $('[data-track-empty]');
  if (searchInput && trackCards.length) {
    const applyFilter = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;
      trackCards.forEach((card) => {
        const title = card.dataset.trackTitle || '';
        const visible = !query || title.includes(query);
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    };
    searchInput.addEventListener('input', applyFilter);
    applyFilter();
  }

  let activeAudio = null;
  let activeButton = null;
  $$('[data-player]').forEach((player) => {
    const audio = $('audio', player);
    const button = $('.player-button', player);
    const range = $('.player-range', player);
    const current = $('[data-current]', player);
    const duration = $('[data-duration]', player);
    if (!audio || !button || !range) return;

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const syncRange = () => {
      const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      range.value = String(progress || 0);
      range.style.setProperty('--progress', `${progress || 0}%`);
      if (current) current.textContent = formatTime(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', () => {
      if (duration) duration.textContent = formatTime(audio.duration);
      syncRange();
    });

    audio.addEventListener('timeupdate', syncRange);
    audio.addEventListener('ended', () => {
      button.textContent = '▶';
      button.setAttribute('aria-pressed', 'false');
      if (current) current.textContent = '0:00';
      range.value = '0';
      range.style.setProperty('--progress', '0%');
      if (activeAudio === audio) {
        activeAudio = null;
        activeButton = null;
      }
    });

    button.addEventListener('click', async () => {
      if (activeAudio && activeAudio !== audio) {
        activeAudio.pause();
        if (activeButton) {
          activeButton.textContent = '▶';
          activeButton.setAttribute('aria-pressed', 'false');
        }
      }
      if (audio.paused) {
        try {
          await audio.play();
          activeAudio = audio;
          activeButton = button;
          button.textContent = '❚❚';
          button.setAttribute('aria-pressed', 'true');
        } catch (error) {
          console.warn('Audio playback blocked', error);
        }
      } else {
        audio.pause();
        button.textContent = '▶';
        button.setAttribute('aria-pressed', 'false');
      }
    });

    audio.addEventListener('pause', () => {
      if (audio !== activeAudio) return;
      button.textContent = '▶';
      button.setAttribute('aria-pressed', 'false');
    });

    audio.addEventListener('play', () => {
      button.textContent = '❚❚';
      button.setAttribute('aria-pressed', 'true');
    });

    range.addEventListener('input', () => {
      if (!audio.duration) return;
      const nextTime = (Number(range.value) / 100) * audio.duration;
      audio.currentTime = nextTime;
      syncRange();
    });
  });

  $$('[data-shop-card]').forEach((card) => {
    const frontImg = $('.shop-image.is-front', card);
    const backImg = $('.shop-image.is-back', card);
    const buyLink = $('[data-buy-link]', card);
    const dots = $$('.color-dot', card);
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        dots.forEach((item) => item.classList.remove('is-selected'));
        dot.classList.add('is-selected');
        if (frontImg && dot.dataset.front) frontImg.src = dot.dataset.front;
        if (backImg && dot.dataset.back) backImg.src = dot.dataset.back;
        if (buyLink && dot.dataset.buyUrl) buyLink.href = dot.dataset.buyUrl;
        card.classList.add('is-flipped');
        window.clearTimeout(card._flipTimeout);
        card._flipTimeout = window.setTimeout(() => card.classList.remove('is-flipped'), 900);
      });
    });
  });

  const galleryItems = $$('[data-gallery-item]');
  const galleryModal = $('[data-gallery-modal]');
  if (galleryItems.length && galleryModal) {
    const galleryImage = $('[data-gallery-image]', galleryModal);
    const galleryCaption = $('[data-gallery-caption]', galleryModal);
    const closeTriggers = $$('[data-gallery-close]', galleryModal);
    const prevButton = $('[data-gallery-prev]', galleryModal);
    const nextButton = $('[data-gallery-next]', galleryModal);
    let currentIndex = 0;

    const render = (index) => {
      const item = galleryItems[index];
      if (!item || !galleryImage || !galleryCaption) return;
      currentIndex = index;
      const image = $('img', item);
      galleryImage.src = item.dataset.full || image?.src || '';
      galleryImage.alt = image?.alt || '';
      galleryCaption.textContent = item.dataset.caption || '';
    };

    const open = (index) => {
      render(index);
      galleryModal.hidden = false;
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      galleryModal.hidden = true;
      document.body.style.overflow = '';
    };

    galleryItems.forEach((item, index) => item.addEventListener('click', () => open(index)));
    closeTriggers.forEach((trigger) => trigger.addEventListener('click', close));
    prevButton?.addEventListener('click', () => render((currentIndex - 1 + galleryItems.length) % galleryItems.length));
    nextButton?.addEventListener('click', () => render((currentIndex + 1) % galleryItems.length));
    document.addEventListener('keydown', (event) => {
      if (galleryModal.hidden) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') render((currentIndex - 1 + galleryItems.length) % galleryItems.length);
      if (event.key === 'ArrowRight') render((currentIndex + 1) % galleryItems.length);
    });
  }

  $$('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.classList.add('media-fallback');
      if (img.dataset.fallbackApplied === 'true') return;
      img.dataset.fallbackApplied = 'true';
      const label = (img.getAttribute('alt') || 'Leskov').slice(0, 28);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#1a3f84"/><stop offset="100%" stop-color="#1f5a78"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)" rx="46"/><g fill="#fff" opacity="0.15"><circle cx="210" cy="170" r="110"/><circle cx="980" cy="760" r="180"/></g><text x="80" y="470" fill="#fff" font-size="72" font-family="Arial, sans-serif" font-weight="700">${label.replace(/[<>&]/g, '')}</text></svg>`;
      img.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }, { once: true });
  });
})();
