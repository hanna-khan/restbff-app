(function () {
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Keep hero image covering the full area when the rotator only swaps backgroundImage
  if (hero) {
    const lockHeroCover = () => {
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center center';
      hero.style.backgroundRepeat = 'no-repeat';
    };
    lockHeroCover();
    const observer = new MutationObserver(lockHeroCover);
    observer.observe(hero, { attributes: true, attributeFilter: ['style'] });
  }

  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const revealItems = document.querySelectorAll('.reveal, .service-card, .stat-card, .program-card, .student-card, .gallery-card, .value-card, .involvement-card, .team-member');
  if (!revealItems.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('visible', 'reveal'));
    return;
  }

  revealItems.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.transitionDelay = `${Math.min(index % 6, 5) * 45}ms`;
        el.classList.add('visible');
        observer.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealItems.forEach((el) => observer.observe(el));
})();
