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

    /* stack line: two copies side by side so the CSS loop is seamless */
    var tk = document.querySelector('[data-ticker]');
    if (tk) tk.innerHTML += tk.innerHTML;

    /* spotlight cards: the light follows the pointer */
    document.querySelectorAll('.role, .proj, .else a, .glance .cell').forEach(function (el) {
      el.classList.add('spot');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    motion();
  });

  /* scroll choreography (GSAP + ScrollTrigger). Without them, or with reduced motion, every
     element is simply in its final place. */
  function motion() {
    var g = window.gsap, ST = window.ScrollTrigger;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) doc.classList.add('reduce');
    if (!g || !ST || reduce) return;
    g.registerPlugin(ST);

    /* hero: words of the headline rise in, then the rest */
    var h1 = document.querySelector('.hero h1');
    if (h1) {
      h1.setAttribute('aria-label', h1.textContent);
      splitWords(h1);
      g.from(h1.querySelectorAll('.wd > span'), { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: .035, delay: .1 });
      g.from(['.hero .eyebrow', '.hero .lede', '.hero .btns', '.hero .term'], { y: 26, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, delay: .35 });
      g.to('.hero > .wrap', { yPercent: -12, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* section titles */
    document.querySelectorAll('.sec-head h2').forEach(function (h) {
      h.setAttribute('aria-label', h.textContent);
      splitWords(h);
      g.from(h.querySelectorAll('.wd > span'), { yPercent: 115, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 85%' } });
    });

    /* story: the timeline fills as you read down it */
    var fill = document.querySelector('[data-story-fill]');
    if (fill) g.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top 70%', end: 'bottom 70%', scrub: .4 } });

    /* primary buttons lean toward the pointer */
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.btn.primary').forEach(function (b) {
        var x = g.quickTo(b, 'x', { duration: .4, ease: 'power3.out' }), y = g.quickTo(b, 'y', { duration: .4, ease: 'power3.out' });
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * .25); y((e.clientY - r.top - r.height / 2) * .35);
        });
        b.addEventListener('pointerleave', function () { x(0); y(0); });
      });
    }
  }

  /* wraps each word in two spans (the outer clips, the inner moves); the text itself is unchanged.
     Inline markup like <em> keeps its words, each wrapped inside it. */
  function splitWords(el) {
    el.classList.add('split');
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/( +)/).forEach(function (part) {
            if (!part) return;
            if (/^ +$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var o = document.createElement('span'); o.className = 'wd'; o.setAttribute('aria-hidden', 'true');
            var i = document.createElement('span'); i.textContent = part; o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  }
  doc.classList.add('js');
})();
