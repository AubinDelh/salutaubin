// main.js — hero clean + overlay + carrousels + infos
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ====== Helper anti double-trigger ====== */
  let __lastNavAt = 0;
  const NAV_GUARD_MS = 220;
  const guard = (fn) => { const n = Date.now(); if (n - __lastNavAt < NAV_GUARD_MS) return; __lastNavAt = n; fn(); };

  /* ====== Swipe util ====== */
  const withSwipe = (root, onLeft, onRight) => {
    if (!root) return;
  
    const isOnArrow = (e) => !!(e.target && e.target.closest('.hero__scroll'));
    let sx = 0, sy = 0, active = false, moved = false;
    const TH = 30;
  
    const getXY = (e) => {
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
    };
  
    const down = (e) => {
      if (isOnArrow(e)) return;
      active = true; moved = false;
      const p = getXY(e); sx = p.x; sy = p.y;
    };
  
    const move = (e) => {
      if (!active || isOnArrow(e)) return;
      const p = getXY(e);
      if (Math.abs(p.x - sx) > 5 || Math.abs(p.y - sy) > 5) moved = true;
      if (Math.abs(p.y - sy) > Math.abs(p.x - sx)) return; // scroll vertical ok
      e.preventDefault();
    };
  
    const up = (e) => {
      if (!active || isOnArrow(e)) return;
      active = false;
      const p = getXY(e), dx = p.x - sx;
      if (Math.abs(dx) > TH) { dx < 0 ? onLeft?.() : onRight?.(); }
      else if (!moved && e.type === 'pointerup') {
        const r = root.getBoundingClientRect();
        const x = (e.clientX ?? p.x) - r.left;
        x < r.width/2 ? onRight?.() : onLeft?.();
      }
      e.preventDefault();
    };
  
    root.addEventListener('pointerdown', down, { passive: true });
    root.addEventListener('pointermove',  move, { passive: false });
    root.addEventListener('pointerup',    up);
    root.addEventListener('touchstart',   down, { passive: true });
    root.addEventListener('touchmove',    move, { passive: false });
    root.addEventListener('touchend',     up);
  };
  
  

  /* ====== Accordéon INFOS ====== */
  document.querySelectorAll('.info-button').forEach((button) => {
    button.addEventListener('click', () => {
      const project = button.closest('.project');
      const details = project?.querySelector('.project--info--details');
      const icon = button.querySelector('.toggle-icon');
      if (!details) return;

      const isOpen = details.classList.contains('open');
      const full = details.scrollHeight;

      if (isOpen) {
        details.style.maxHeight = full + 'px';
        requestAnimationFrame(() => {
          details.style.maxHeight = '0px';
          details.classList.remove('open');
          if (icon) icon.textContent = '+';
        });
      } else {
        details.classList.add('open');
        details.style.maxHeight = '0px';
        requestAnimationFrame(() => {
          details.style.maxHeight = full + 'px';
          if (icon) icon.textContent = '–';
        });
      }

      const onEnd = (e) => {
        if (e.propertyName !== 'max-height') return;
        if (details.classList.contains('open')) details.style.maxHeight = '';
        details.removeEventListener('transitionend', onEnd);
      };
      details.addEventListener('transitionend', onEnd);
    });
  });

  /* ====== Carrousels projets ====== */
  const fitCarouselHeight = (carousel) => {
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (!isMobile) { carousel.style.height = ''; return; }
    const active = carousel.querySelector('img.active');
    if (!active || !active.naturalWidth) return;
    const ratio = active.naturalHeight / active.naturalWidth;
    const w = carousel.clientWidth || carousel.parentElement.clientWidth || window.innerWidth;
    let h = Math.round(w * ratio);
    const maxH = Math.round((window.visualViewport?.height || window.innerHeight) * 0.8);
    if (h > maxH) h = maxH;
    carousel.style.height = h + 'px';
  };

  document.querySelectorAll('.project .carousel').forEach((carousel) => {
    const imgs = Array.from(carousel.querySelectorAll('img'));
    if (!imgs.length) return;

    imgs.forEach(img => {
      if (!img.loading) img.loading = 'lazy';
      img.addEventListener('load', () => { if (img.classList.contains('active')) fitCarouselHeight(carousel); });
    });

    let i = Math.max(0, imgs.findIndex(el => el.classList.contains('active')));
    if (i < 0) i = 0;

    const render = () => {
      imgs.forEach((img, idx) => img.classList.toggle('active', idx === i));
      const counterEl = carousel.closest('.project')?.querySelector('.carousel-counter');
      if (counterEl) {
        const total = imgs.length.toString().padStart(2,'0');
        const cur = (i+1).toString().padStart(2,'0');
        counterEl.textContent = `${cur}/${total}`;
      }
      fitCarouselHeight(carousel);
    };

    const next = () => { i = (i + 1) % imgs.length; render(); };
    const prev = () => { i = (i - 1 + imgs.length) % imgs.length; render(); };

    carousel.addEventListener('click', (e) => {
      const rect = carousel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      x < rect.width/2 ? guard(prev) : guard(next);
    });

    withSwipe(carousel, () => guard(next), () => guard(prev));

    carousel.tabIndex = 0;
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') guard(next);
      if (e.key === 'ArrowLeft')  guard(prev);
    });

    render();
    window.addEventListener('resize', () => fitCarouselHeight(carousel));
    if ('visualViewport' in window) visualViewport.addEventListener('resize', () => fitCarouselHeight(carousel));
  });

  /* ====== HERO plein écran + overlay ====== */
  const hero  = document.querySelector('.hero');
  const track = hero?.querySelector('.hero__track');
  const arrow = hero?.querySelector('.hero__scroll');

  if (arrow) {
    const target = document.getElementById('after-hero');
    const header = document.querySelector('.site-header');
  
    // Empêche le hero de capter les events de la flèche
    ['pointerdown','pointerup','touchstart','touchend','click'].forEach(type => {
      arrow.addEventListener(type, (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, { capture: true });
    });
  
    // Scroll lisse vers la section projets en compensant le header fixe
    arrow.addEventListener('click', (e) => {
      e.preventDefault();
      const y = (target?.getBoundingClientRect().top || 0) + window.scrollY - (header?.offsetHeight || 0);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
  }
  

  const setUI = (mode) => document.documentElement.setAttribute('data-ui', mode);

  // luma auto si pas de data-tone
  function avgLumaFrom(el){
    try{
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d', { willReadFrequently:true });
      const w = c.width = 24, h = c.height = 24;
      if (el.tagName === 'IMG'){
        if (!el.complete || !el.naturalWidth) return null;
        ctx.drawImage(el, 0, 0, w, h);
      } else if (el.tagName === 'VIDEO'){
        if (el.readyState < 2) return null; // pas de frame dispo
        ctx.drawImage(el, 0, 0, w, h);
      } else return null;
      const data = ctx.getImageData(0,0,w,h).data;
      let sum = 0;
      for (let i=0;i<data.length;i+=4){
        const r=data[i], g=data[i+1], b=data[i+2];
        sum += 0.2126*r + 0.7152*g + 0.0722*b;
      }
      return sum / (data.length/4); // 0..255
    }catch(_){ return null; }
  }

  function applyUIFor(slide){
    const tone = slide?.dataset?.tone;
    if (tone === 'dark') { setUI('dark'); return; }
    if (tone === 'light'){ setUI('light'); return; }
    const l = avgLumaFrom(slide);
    if (l == null){
      const ev = slide?.tagName === 'VIDEO' ? 'loadeddata' : 'load';
      slide?.addEventListener(ev, () => applyUIFor(slide), { once:true });
      return;
    }
    setUI(l < 140 ? 'dark' : 'light'); // seuil ajustable
  }

  if (hero && track){
    const slides = Array.from(track.querySelectorAll(':scope > img, :scope > picture > img, :scope > video'));
    if (!slides.length) return;

    // setup videos
    slides.forEach(el => { if (el.tagName === 'VIDEO'){ el.muted = true; el.playsInline = true; } });

    let i = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
    if (i < 0) i = 0;

    const render = () => {
      slides.forEach((el, idx) => {
        const active = (idx === i);
        el.classList.toggle('is-active', active);
        if (el.tagName === 'VIDEO'){
          if (active){
            const v = el;
            const start = () => { try{ v.currentTime = 0; }catch{} v.play().catch(()=>{}); };
            if (v.readyState < 1) v.addEventListener('loadedmetadata', start, { once:true });
            else start();
          } else {
            const v = el; v.pause(); try{ v.currentTime = 0; }catch{}
          }
        }
      });
      applyUIFor(slides[i]);
    };

    const next = () => { i = (i + 1) % slides.length; render(); };
    const prev = () => { i = (i - 1 + slides.length) % slides.length; render(); };

    // clic partout (sauf flèche) + swipe + clavier
    hero.addEventListener('click', (e) => { if (!e.target.closest('.hero__scroll')) guard(next); });
    withSwipe(hero, () => guard(next), () => guard(prev));
    hero.tabIndex = 0;
    hero.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') guard(next); if (e.key === 'ArrowLeft') guard(prev); });

    // IO : flèche visible seulement quand le hero est présent,
    // et overlay redevient "light" dès qu’on sort du hero
    if (arrow && 'IntersectionObserver' in window){
      const io = new IntersectionObserver(([entry]) => {
        const visible = !!entry?.isIntersecting;
        arrow.classList.toggle('is-hidden', !visible);
        if (!visible) setUI('light');
        else applyUIFor(slides[i]);
      }, { threshold: 0.2 });
      io.observe(hero);
    }

    // init render
    render();
  }
});
// ===== Curseur texte NEXT / PREVIOUS sur les carrousels + hero =====
(function () {
  const label = document.getElementById('cursor-label');
  if (!label) return;

  // Carrousels + hero
  const zones = document.querySelectorAll('.carousel, .hero__track');
  if (!zones.length) return;

  function handleMove(e) {
    const zone = e.currentTarget;
    const rect = zone.getBoundingClientRect();
    const x = e.clientX;

    const isLeft = x < rect.left + rect.width / 2;
    const text = isLeft ? 'Previous' : 'Next';

    label.textContent = text;
    label.style.top = e.clientY + 'px';
    label.style.left = e.clientX + 'px';
  }

  function handleEnter(e) {
    e.currentTarget.classList.add('is-text-cursor');
    label.classList.add('is-visible');
  }

  function handleLeave(e) {
    e.currentTarget.classList.remove('is-text-cursor');
    label.classList.remove('is-visible');
  }

  zones.forEach((zone) => {
    zone.addEventListener('mouseenter', handleEnter);
    zone.addEventListener('mouseleave', handleLeave);
    zone.addEventListener('mousemove', handleMove);
  });
})();
// ===== Curseur cercle spécial pour les boutons =====
(function () {
  const circle = document.getElementById('cursor-circle');
  if (!circle) return;

  // Quels éléments déclenchent le grand cercle ?
  const targets = document.querySelectorAll('button, a, .info-button, .to-top');

  function moveCircle(e) {
    circle.style.left = e.clientX + 'px';
    circle.style.top = e.clientY + 'px';
  }

  function enter() {
    circle.classList.add('is-visible');
    document.body.classList.add('cursor-hidden');
  }

  function leave() {
    circle.classList.remove('is-visible');
    document.body.classList.remove('cursor-hidden');
  }

  // On cache le curseur normal quand le cercle apparaît
  const style = document.createElement('style');
  style.innerHTML = `
    body.cursor-hidden, body.cursor-hidden * {
      cursor: none !important;
    }
  `;
  document.head.appendChild(style);

  // Appliquer sur tous les boutons
  targets.forEach(el => {
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    el.addEventListener('mousemove', moveCircle);
  });
})();

