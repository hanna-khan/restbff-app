(function () {
  const filters = document.querySelectorAll('.gallery-filter');
  const cards = Array.from(document.querySelectorAll('.gallery-card'));
  const lightbox = document.getElementById('lightbox');
  if (!filters.length || !cards.length || !lightbox) return;

  const mediaWrap = lightbox.querySelector('.lightbox-media');
  const caption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-nav.prev');
  const nextBtn = lightbox.querySelector('.lightbox-nav.next');

  let visibleCards = cards.slice();
  let currentIndex = 0;

  function applyFilter(filter) {
    filters.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === filter));
    visibleCards = [];
    cards.forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hidden', !match);
      if (match) visibleCards.push(card);
    });
  }

  function openLightbox(index) {
    if (!visibleCards.length) return;
    currentIndex = (index + visibleCards.length) % visibleCards.length;
    const card = visibleCards[currentIndex];
    const src = card.dataset.src;
    const type = card.dataset.type || 'image';
    const label = card.dataset.label || '';

    mediaWrap.innerHTML = '';
    if (type === 'video') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.src = src;
      mediaWrap.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = label;
      mediaWrap.appendChild(img);
    }
    caption.textContent = label;
    lightbox.hidden = false;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    const playing = mediaWrap.querySelector('video');
    if (playing) playing.pause();
    lightbox.classList.remove('open');
    lightbox.hidden = true;
    mediaWrap.innerHTML = '';
    document.body.style.overflow = '';
  }

  filters.forEach((btn) => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const index = visibleCards.indexOf(card);
      openLightbox(index);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => openLightbox(currentIndex - 1));
  nextBtn.addEventListener('click', () => openLightbox(currentIndex + 1));

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') openLightbox(currentIndex - 1);
    if (event.key === 'ArrowRight') openLightbox(currentIndex + 1);
  });

  // Deep-link support: #school-visits, #flyers, etc.
  const hash = window.location.hash.replace('#', '');
  if (hash && document.querySelector(`[data-filter="${hash}"]`)) {
    applyFilter(hash);
    const section = document.getElementById(hash) || document.getElementById('gallery');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
})();
