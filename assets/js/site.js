(function () {
  var doc = document.documentElement;

  /* theme: system by default, manual override remembered per browser */
  function stored() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem('theme', v); } catch (e) {} }
  var t = stored();
  if (t === 'light' || t === 'dark') doc.setAttribute('data-theme', t);
  function isDark() {
    var a = doc.getAttribute('data-theme');
    if (a) return a === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var tb = document.querySelector('[data-theme-toggle]');
    function label() { if (tb) tb.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme'); }
    label();
    if (tb) tb.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      doc.setAttribute('data-theme', next); store(next); label();
    });

    /* nav: border on scroll, mobile menu, active section */
    var nav = document.querySelector('.nav');
    var onScroll = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    /* hero terminal: types each command, then reveals its output. Lines keep their space
       while hidden, so nothing below moves. Reduced motion shows the finished session. */
    var term = document.querySelector('[data-term]');
    if (term) {
      var lines = [].slice.call(term.querySelectorAll('.ln'));
      var caret = term.querySelector('.caret');
      var timers = [];
      var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
      var finish = function () {
        lines.forEach(function (l) { l.classList.add('on'); });
        term.querySelectorAll('[data-type]').forEach(function (s) { s.textContent = s.getAttribute('data-type'); });
        lines[lines.length - 1].appendChild(caret);
        term.classList.remove('typing'); term.classList.add('done');
      };
      var play = function () {
        timers.forEach(clearTimeout); timers = [];
        term.classList.add('anim'); term.classList.remove('done');
        lines.forEach(function (l) { l.classList.remove('on'); });
        term.querySelectorAll('[data-type]').forEach(function (s) {
          if (!s.hasAttribute('data-type') || !s.getAttribute('data-type')) s.setAttribute('data-type', s.textContent);
          s.textContent = '';
        });
        var t = 450;
        lines.forEach(function (l, i) {
          var typed = l.querySelector('[data-type]');
          if (typed) {
            var text = typed.getAttribute('data-type');
            later(function () { l.classList.add('on'); l.appendChild(caret); term.classList.add('typing'); }, t);
            t += 380;
            for (var k = 1; k <= text.length; k++) {
              (function (k) { later(function () { typed.textContent = text.slice(0, k); }, t); })(k);
              t += 45 + Math.round(Math.random() * 55);
            }
            later(function () { term.classList.remove('typing'); }, t);
            t += 260;
          } else if (i === lines.length - 1) {
            later(finish, t);
          } else {
            later(function () { l.classList.add('on'); }, t);
            t += 140 + l.textContent.split('\n').length * 70;
          }
        });
      };
      term.querySelectorAll('[data-type]').forEach(function (s) { s.setAttribute('data-type', s.textContent); });
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) finish(); else play();
      var rb = term.querySelector('[data-term-replay]');
      if (rb) rb.addEventListener('click', play);
    }

    var mb = document.querySelector('[data-menu]');
    if (mb && nav) {
      mb.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.querySelectorAll('ul a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); });
      });
    }
    var links = {};
    document.querySelectorAll('.nav ul a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && links[e.target.id]) {
            Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); links[k].removeAttribute('aria-current'); });
            links[e.target.id].classList.add('active'); links[e.target.id].setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });

      /* gentle reveal */
      var rv = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('.reveal').forEach(function (el) { rv.observe(el); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }
  });
  doc.classList.add('js');
})();
