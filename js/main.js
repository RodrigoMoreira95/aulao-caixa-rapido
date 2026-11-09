(function () {
  'use strict';

  // Coloque aqui o link de inscrição (página de captura/checkout).
  // Enquanto estiver vazio, os botões rolam para a seção final.
  var CHECKOUT_URL = '';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Links de inscrição ---------- */
  if (CHECKOUT_URL) {
    $('[data-cta]').forEach(function (a) { a.setAttribute('href', CHECKOUT_URL); });
  } else {
    var last = document.querySelector('.final [data-cta]');
    if (last) last.setAttribute('href', '#topo');
  }

  /* ---------- Efeito de texto: palavra por palavra ---------- */
  function splitNode(node, state) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var parts = child.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          frag.appendChild(wordEl(document.createTextNode(p), state));
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        if (child.hasAttribute('data-count')) {
          var w = wordEl(child.cloneNode(true), state);
          node.replaceChild(w, child);
        } else {
          splitNode(child, state);
        }
      }
    });
  }
  function wordEl(content, state) {
    var w = document.createElement('span'); w.className = 'word';
    var i = document.createElement('span'); i.appendChild(content);
    i.style.setProperty('--i', state.i++);
    w.appendChild(i); return w;
  }
  $('[data-split]').forEach(function (el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    if (!reduce) { splitNode(el, { i: 0 }); $('.word', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); }); }
  });

  /* ---------- Contador R$ 300,00 ---------- */
  function fmt(n) { return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')); if (!to || reduce) return;
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    var dur = 1600, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    }
    el.textContent = fmt(0); requestAnimationFrame(step);
    setTimeout(function () { el.textContent = fmt(to); }, dur + 400); // garantia
  }

  /* ---------- Revelação ao rolar ---------- */
  $('[data-stagger]').forEach(function (g) {
    Array.prototype.slice.call(g.children).forEach(function (c, i) { c.style.setProperty('--d', (i * 100) + 'ms'); });
  });

  function show(el) {
    el.classList.add('is-visible');
    if (el.hasAttribute('data-split')) $('[data-count]', el).forEach(function (c) { setTimeout(function () { countUp(c); }, 250); });
  }

  // Hero: entrada em cascata ao carregar
  $('[data-hero]').forEach(function (el, i) {
    setTimeout(function () { show(el); }, reduce ? 0 : 150 + i * 140);
  });

  var targets = $('[data-reveal],[data-split]').filter(function (el) { return !el.hasAttribute('data-hero'); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(show);
  }

  /* ---------- Barra de progresso ---------- */
  var bar = document.querySelector('.progress span');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar && h > 0) bar.style.transform = 'scaleX(' + Math.min(window.scrollY / h, 1) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- CTA fixo no celular/tablet ---------- */
  var sticky = document.querySelector('[data-sticky]');
  var hero = document.querySelector('.hero'), fin = document.querySelector('.final');
  if (sticky && 'IntersectionObserver' in window) {
    var vis = { hero: true, fin: false };
    var upd = function () {
      var on = !vis.hero && !vis.fin;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      sticky.tabIndex = on ? 0 : -1;
    };
    new IntersectionObserver(function (e) { vis.hero = e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (e) { vis.fin = e[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(fin);
  }
})();
