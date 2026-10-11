/* REST Foundation — motion + accessibility layer. Additive: does not touch i18n, forms, gallery or menu logic. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Menu: expose state to assistive tech, close on Escape (script.js toggles .active)
  var ham = doc.querySelector('.hamburger');
  var menu = doc.querySelector('.nav-menu');
  if (ham && menu) {
    menu.id = menu.id || 'primary-menu';
    ham.setAttribute('aria-controls', menu.id);
    var sync = function () {
      var open = ham.classList.contains('active') || menu.classList.contains('active');
      ham.setAttribute('aria-expanded', String(open));
    };
    sync();
    var mo = new MutationObserver(sync);
    mo.observe(ham, { attributes: true, attributeFilter: ['class'] });
    mo.observe(menu, { attributes: true, attributeFilter: ['class'] });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ham.classList.contains('active')) ham.click();
    });
  }

  if (reduce || !window.gsap) return;
  gsap.ticker.lagSmoothing(0); // entrances finish on real time even if a frame is slow

  // Scroll progress bar (transform only)
  var bar = doc.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(bar);
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
      ticking = false;
    });
  }, { passive: true });

  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // Hero: staged entrance, then the foundation stack settles layer by layer
  var hero = doc.querySelector('.hero');
  if (hero) {
    var clear = { clearProps: 'opacity,transform' };
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-eyebrow', Object.assign({ y: 16, opacity: 0, duration: 0.6 }, clear))
      .from('.hero-title', Object.assign({ y: 32, opacity: 0, duration: 0.9 }, clear), '-=0.35')
      .from('.hero-subtitle', Object.assign({ y: 20, opacity: 0, duration: 0.7 }, clear), '-=0.55')
      .from('.hero-buttons .btn', Object.assign({ y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, clear), '-=0.45');

    var layers = gsap.utils.toArray('.fs-layer');
    var scene = doc.querySelector('.fs-scene');
    if (layers.length && scene && window.matchMedia('(min-width: 900px)').matches) {
      tl.fromTo(layers, { '--lift': '320px', opacity: 0 },
        { '--lift': '0px', opacity: 1, duration: 1.1, stagger: 0.16, ease: 'power4.out' }, 0.25);
      if (fine) {
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(scene, { '--rz': (-38 + x * 10) + 'deg', '--rx': (58 - y * 8) + 'deg', duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
        });
      }
    }
  }

  if (window.ScrollTrigger) {
    // Page headers drift slightly slower than the page
    var ph = doc.querySelector('.page-header .container');
    if (ph) {
      gsap.to(ph, { yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: '.page-header', start: 'top top', end: 'bottom top', scrub: true } });
    }
    // Section images ease from slightly zoomed to resting scale
    gsap.utils.toArray('.section-image img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom 40%', scrub: 0.6 } });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    doc.querySelectorAll('.btn-lang').forEach(function (b) {
      b.addEventListener('click', function () { setTimeout(function () { ScrollTrigger.refresh(); }, 350); });
    });
  }

  // Subtle 3D tilt on cards that script.js does not animate inline
  if (fine) {
    doc.querySelectorAll('.program-card, .student-card, .impact-card, .mission-card, .service-card, .value-card, .involvement-card, .stat-card, .team-member').forEach(function (card) {
      card.setAttribute('data-tilt', '');
      card.classList.add('has-spot');
      card.addEventListener('pointerenter', function () { card.classList.add('is-tilting'); });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ty', (x * 6).toFixed(2) + 'deg');
        card.style.setProperty('--tx', (-y * 6).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.setProperty('--tx', '0deg');
        card.style.setProperty('--ty', '0deg');
      });
    });
  }

  // Page titles: clipped reveal (one orchestrated moment per page)
  var pt = doc.querySelectorAll('.page-header h1, .page-header p');
  if (pt.length) {
    gsap.from(pt, { clipPath: 'inset(0 0 100% 0)', y: 28, opacity: 0, duration: 0.95, stagger: 0.12, ease: 'power3.out', clearProps: 'all' });
  }

  if (fine) {
    // Cursor spotlight inside cards
    doc.querySelectorAll('.contact-item, .gallery-card, .video-card').forEach(function (c) { c.classList.add('has-spot'); });
    doc.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.has-spot');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    // Magnetic call-to-action buttons (CSS translate via variables)
    doc.querySelectorAll('.btn-primary, .btn-accent, .btn-light').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
        b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  // ---------- Three.js (lazy-loaded, desktop only, pauses off-screen) ----------
  var lowPower = window.innerWidth < 900 || (navigator.hardwareConcurrency || 4) <= 2;
  if (lowPower) return;
  var s3 = doc.createElement('script');
  s3.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s3.onload = function () { try { initThree(); } catch (err) { /* CSS fallback stays */ } };
  doc.head.appendChild(s3);

  function slabGeometry() {
    var w = 3.2, h = 3.2, r = 0.55, x = -w / 2, y = -h / 2, sh = new THREE.Shape();
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
    sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
    sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.34, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 10 });
  }

  function seeds(n, spread) {
    var pos = new Float32Array(n * 3), spd = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread[0];
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
      spd[i] = 0.12 + Math.random() * 0.3;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x6bd3ad, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false }));
    pts.userData = { spd: spd, h: spread[1] };
    return pts;
  }

  function stepSeeds(pts, dt) {
    var a = pts.geometry.attributes.position, half = pts.userData.h / 2;
    for (var i = 0; i < a.count; i++) {
      var y = a.getY(i) + pts.userData.spd[i] * dt;
      a.setY(i, y > half ? -half : y);
    }
    a.needsUpdate = true;
  }

  function stage(host, canvas, build, camZ) {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    cam.position.set(0, 3.2, camZ); cam.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x0b2f25, 0.95));
    var dl = new THREE.DirectionalLight(0xffffff, 0.95); dl.position.set(4, 7, 8); scene.add(dl);
    var tick = build(scene);
    var size = function () {
      var w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    };
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(host);
    var visible = true, last = performance.now();
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(host);
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!visible || doc.hidden) { last = now; return; }
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      tick(now / 1000, dt);
      renderer.render(scene, cam);
    })(last);
  }

  function initThree() {
    var probe = doc.createElement('canvas');
    if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return;

    // Home hero: four rounded slabs = the four layers of the foundation
    var host = doc.querySelector('.foundation-stack');
    if (host) {
      var canvas = doc.createElement('canvas'); canvas.className = 'fs-canvas'; canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas); host.classList.add('has-webgl');
      var mouse = { x: 0, y: 0 };
      var heroEl = doc.querySelector('.hero');
      if (fine && heroEl) heroEl.addEventListener('pointermove', function (e) {
        var r = heroEl.getBoundingClientRect();
        mouse.x = (e.clientX - r.left) / r.width - 0.5; mouse.y = (e.clientY - r.top) / r.height - 0.5;
      });
      stage(host, canvas, function (scene) {
        var group = new THREE.Group(); scene.add(group);
        var geo = slabGeometry(), cols = [0x0d3a2c, 0x167d5a, 0x35b889, 0xeaf7f0], slabs = [];
        cols.forEach(function (c, i) {
          var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.06, transparent: true, opacity: 0 }));
          m.rotation.x = -Math.PI / 2; m.userData.base = i * 0.62 - 0.9; m.position.y = m.userData.base + 5; group.add(m); slabs.push(m);
          gsap.to(m.position, { y: m.userData.base, duration: 1.3, delay: 0.3 + i * 0.16, ease: 'power4.out' });
          gsap.to(m.material, { opacity: 1, duration: 0.6, delay: 0.3 + i * 0.16 });
        });
        var pts = seeds(160, [9, 8, 5]); scene.add(pts);
        return function (t, dt) {
          group.rotation.y += ((-0.62 + mouse.x * 0.5 + Math.sin(t * 0.35) * 0.08) - group.rotation.y) * 0.06;
          group.rotation.x += ((mouse.y * 0.25) - group.rotation.x) * 0.06;
          slabs.forEach(function (m, i) { if (m.material.opacity > 0.99) m.position.y = m.userData.base + Math.sin(t * 0.9 + i * 0.9) * 0.07; });
          stepSeeds(pts, dt);
        };
      }, 9.6);
    }

    // Inner pages: drifting seeds + slow low-poly shapes behind the page title
    var ph = doc.querySelector('.page-header');
    if (ph && !host) {
      var pc = doc.createElement('canvas'); pc.className = 'pg-canvas'; pc.setAttribute('aria-hidden', 'true');
      ph.insertBefore(pc, ph.firstChild);
      stage(ph, pc, function (scene) {
        var pts = seeds(120, [16, 7, 5]); scene.add(pts);
        var shapes = [[5.2, 0.6, 1.3, 0x35b889], [-5.6, -0.6, 0.8, 0x6bd3ad]].map(function (d) {
          var m = new THREE.Mesh(new THREE.IcosahedronGeometry(d[2], 0), new THREE.MeshStandardMaterial({ color: d[3], roughness: 0.4, flatShading: true, transparent: true, opacity: 0.55 }));
          m.position.set(d[0], d[1], -1); scene.add(m); return m;
        });
        return function (t, dt) {
          shapes.forEach(function (m, i) { m.rotation.x = t * 0.18 + i; m.rotation.y = t * 0.24; m.position.y += Math.sin(t * 0.6 + i) * 0.002; });
          stepSeeds(pts, dt);
        };
      }, 14);
    }
  }
})();
