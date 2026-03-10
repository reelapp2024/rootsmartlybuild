
/* ES5-safe, shared core (nx namespace) */
(function () {
  if (window.__NX_CORE_BOOTED) return;
  window.__NX_CORE_BOOTED = true;

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts || false); }
  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches ? el.matches(sel) : el.msMatchesSelector && el.msMatchesSelector(sel)) return el;
      el = el.parentNode;
    }
    return null;
  }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function numfmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* ---------- sticky tabs + indicator + a11y ---------- */
  function bootTabs() {
    var tabs = $('#nxTabs');
    var tabList = tabs ? tabs.querySelector('.nx-tablist') : null;
    var indicator = tabs ? tabs.querySelector('.nx-tab-indicator') : null;
    var sentinel = $('#nxTabsSentinel');

    if (tabs && sentinel && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (arr) {
        var stuck = arr[0] && arr[0].intersectionRatio === 0;
        tabs.classList.toggle('is-stuck', stuck);
        document.body.classList.toggle('tabs-stuck', stuck);
      }, { threshold: [0, 1] });
      io.observe(sentinel);
    }

    if (!tabList) return;

    // prepare roles/aria (without changing HTML structure)
    var links = $all('a.nx-tab[href^="#"]', tabList);
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('role', 'tab');
      links[i].setAttribute('tabindex', i === 0 ? '0' : '-1');
      links[i].setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    }

    function setActive(a) {
      if (!a) return;
      for (var i = 0; i < links.length; i++) {
        links[i].classList.remove('is-active');
        links[i].setAttribute('aria-selected', 'false');
        links[i].setAttribute('tabindex', '-1');
      }
      a.classList.add('is-active');
      a.setAttribute('aria-selected', 'true');
      a.setAttribute('tabindex', '0');
      moveIndicator();
    }

    function moveIndicator() {
      if (!indicator) return;
      var active = tabList.querySelector('.nx-tab.is-active') || links[0];
      if (!active) return;
      var x = active.offsetLeft - tabList.scrollLeft;
      indicator.style.width = active.offsetWidth + 'px';
      indicator.style.transform = 'translateX(' + x + 'px)';
    }

    // initial active (hash-aware)
    if (location.hash) {
      var current = tabList.querySelector('a.nx-tab[href="' + location.hash + '"]');
      if (current) setActive(current);
    } else if (links[0]) {
      setActive(links[0]);
    }

    // click to scroll + activate
    on(tabList, 'click', function (e) {
      var a = closest(e.target, 'a.nx-tab');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id && id.charAt(0) === '#') {
        var target = $(id);
        if (target) {
          e.preventDefault();
          var rm = false;
          if (!target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); rm = true; }
          if (target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          try { history.pushState(null, '', id); } catch (e2) {}
          setActive(a);
          setTimeout(function () { target.focus(); if (rm) target.removeAttribute('tabindex'); }, 300);
        }
      }
    });

    // keyboard nav
    on(tabList, 'keydown', function (e) {
      var key = e.key || e.which;
      var idx, next;
      for (var i = 0; i < links.length; i++) { if (links[i].classList.contains('is-active')) { idx = i; break; } }
      if (idx == null) idx = 0;
      if (key === 'ArrowRight' || key === 39) { next = links[idx + 1] || links[0]; }
      else if (key === 'ArrowLeft' || key === 37) { next = links[idx - 1] || links[links.length - 1]; }
      else if (key === 'Home' || key === 36) { next = links[0]; }
      else if (key === 'End' || key === 35) { next = links[links.length - 1]; }
      else if (key === 'Enter' || key === 13 || key === ' ' || key === 32) {
        var href = links[idx].getAttribute('href'); var t = href ? $(href) : null;
        if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); e.preventDefault(); }
        return;
      } else { return; }
      if (next) { next.focus(); setActive(next); }
      e.preventDefault();
    });

    // maintain indicator on scroll/resize/hash
    on(tabList, 'scroll', moveIndicator, { passive: true });
    on(window, 'resize', moveIndicator);
    on(window, 'load', function () { setTimeout(moveIndicator, 0); });
    on(window, 'hashchange', function () {
      var a = tabList.querySelector('a[href="' + location.hash + '"]');
      if (a) setActive(a);
    });
    moveIndicator();

    // scroll-spy: derive ids from tab hrefs
    var ids = [];
    for (var j = 0; j < links.length; j++) {
      var h = links[j].getAttribute('href');
      if (h && h.indexOf('#') === 0) ids.push(h.slice(1));
    }
    var secs = [];
    for (var k = 0; k < ids.length; k++) { var s = document.getElementById(ids[k]); if (s) secs.push(s); }

    if (secs.length && 'IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (entries) {
        var vis = null, max = -1;
        for (var i2 = 0; i2 < entries.length; i2++) {
          if (entries[i2].isIntersecting && entries[i2].intersectionRatio > max) {
            vis = entries[i2]; max = entries[i2].intersectionRatio;
          }
        }
        if (!vis) return;
        var link = tabList.querySelector('a[href="#' + vis.target.id + '"]');
        if (link) setActive(link);
      }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
      for (var sIdx = 0; sIdx < secs.length; sIdx++) so.observe(secs[sIdx]);
    }
  }

  /* ---------- progress bar ---------- */
  function bootProgress() {
    var wrap = $('#nxProgress'); if (!wrap) return;
    var bar = wrap.querySelector('.nx-bar');
    var pctEl = $('#nxPct');
    var msgEl = $('#nxMsg');

    function msg(v) {
      if (v >= 100) return 'Done! 🎉';
      if (v >= 90) return 'Final stretch 🏁';
      if (v >= 50) return 'Halfway there ⚡️';
      if (v >= 10) return 'Good start 👏';
      return 'Let\u2019s begin';
    }
    var ticking = false;
    function calc() {
      var d = document.documentElement, b = document.body;
      var max = Math.max(
        b.scrollHeight, b.offsetHeight, b.clientHeight,
        d.scrollHeight, d.offsetHeight, d.clientHeight
      ) - window.innerHeight;
      var y = window.pageYOffset || d.scrollTop || 0;
      var v = clamp(Math.round((max > 0 ? y / max : 0) * 100), 0, 100);
      if (bar) bar.style.width = v + '%';
      if (pctEl) pctEl.textContent = v + '%';
      if (msgEl) msgEl.textContent = msg(v);
      wrap.setAttribute('aria-valuenow', String(v));
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        if (window.requestAnimationFrame) requestAnimationFrame(calc); else calc();
        ticking = true;
      }
    }
    on(window, 'scroll', onScroll, { passive: true });
    on(window, 'resize', onScroll, { passive: true });
    calc();
  }

  /* ---------- word count + read time ---------- */
  function bootWordcount() {
    var main = $('#nxMainContent'); if (!main) return;
    var wc = $('#nxWordCount');
    var rt = $('#nxReadTime');

    var text = main.innerText || main.textContent || '';
    var wordsArr = text.match(/\b\w+\b/g) || [];
    var words = wordsArr.length;
    if (wc) wc.textContent = numfmt(words) + ' words';

    if (rt) {
      var existing = (rt.textContent || '').trim();
      var hasNumbers = /\d/.test(existing);
      if (!existing || existing === '—' || existing === '-' || !hasNumbers) {
        var mins = Math.max(1, Math.round(words / 220));
        rt.textContent = mins + ' min read';
      }
    }
  }

  /* ---------- copy buttons ---------- */
  function bootCopy() {
    var btns = $all('.nx-btn-copy[data-copy-target]');
    function doCopy(btn) {
      var sel = btn.getAttribute('data-copy-target');
      var el = sel ? $(sel) : null;
      if (!el) return;
      var txt = (el.innerText || el.textContent || '').replace(/^\s+|\s+$/g, '');
      function ok(label) {
        var old = btn.textContent;
        btn.textContent = label || 'Copied!';
        setTimeout(function () { btn.textContent = old || 'Copy'; }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { ok('Copied!'); }, function () {
          var r = document.createRange(); r.selectNodeContents(el);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          ok('Press Ctrl/Cmd+C'); setTimeout(function () { s.removeAllRanges(); }, 1200);
        });
      } else {
        var r2 = document.createRange(); r2.selectNodeContents(el);
        var s2 = window.getSelection(); s2.removeAllRanges(); s2.addRange(r2);
        ok('Press Ctrl/Cmd+C'); setTimeout(function () { s2.removeAllRanges(); }, 1200);
      }
    }
    for (var i = 0; i < btns.length; i++) on(btns[i], 'click', function (e) { doCopy(e.currentTarget); });
  }

  /* ---------- voice presence + prompt links ---------- */
  function bootVoice() {
    var v1 = $('#nxVoiceStatus'); // optional
    var hasVoice = ('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window);
    if (v1) v1.innerHTML = hasVoice ? 'Voice: <strong>ready</strong>' : 'Voice: <strong>not supported</strong>';

    // click-to-jump items with data-target
    var voiceLists = $all('.nx-voice-card ul li[data-target], #nxVoicePrompts ul li[data-target]');
    for (var i = 0; i < voiceLists.length; i++) {
      on(voiceLists[i], 'click', function (e) {
        var t = e.currentTarget.getAttribute('data-target');
        var el = t ? $(t) : null;
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // optional simple mic (if present)
    var micBtn = $('#nx-voice-mic');
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recog = null;
    if (micBtn && SR) {
      recog = new SR();
      recog.lang = 'en-US';
      recog.interimResults = false;
      recog.maxAlternatives = 1;

      function speak(t) {
        try { var u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; window.speechSynthesis.speak(u); } catch (e) {}
      }
      function go(hash) {
        var el = $(hash);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }

      recog.addEventListener('result', function (e) {
        var said = (e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript || '').toLowerCase();
        if (said.indexOf('verdict') > -1) { go('#nxVerdict'); speak('Opening verdict.'); return; }
        if (said.indexOf('faq') > -1 || said.indexOf('questions') > -1) { go('#nxFaqs'); speak('Jumping to questions.'); return; }
        if (said.indexOf('copy') > -1) {
          var btn = $('.nx-btn-copy');
          if (btn) { btn.click(); speak('Copied.'); return; }
        }
        speak('Sorry, I did not catch that.');
      });
      recog.addEventListener('end', function () { micBtn.textContent = '🎤 Start voice'; });

      on(micBtn, 'click', function () {
        try { micBtn.textContent = '🛑 Stop voice'; recog.start(); }
        catch (e) { try { recog.stop(); } catch (_) {} micBtn.textContent = '🎤 Start voice'; }
      });
    }
  }

  /* ---------- comments (both patterns) ---------- */
  function bootComments() {
    // Pattern A (simple): #commentForm -> #commentsList (no storage)
    var formA = $('#commentForm');
    var listA = $('#commentsList');
    if (formA) {
      on(formA, 'submit', function (e) {
        e.preventDefault();
        var name = ($('#name') && $('#name').value || 'Anonymous').replace(/^\s+|\s+$/g, '');
        var text = ($('#comment') && $('#comment').value || 'Thanks!').replace(/^\s+|\s+$/g, '');
        var rc = document.querySelector('input[name="rating"]:checked');
        var rating = rc ? parseInt(rc.value, 10) : 5;
        rating = isNaN(rating) ? 5 : clamp(rating, 0, 5);
        var stars = new Array(rating + 1).join('★') + new Array(5 - rating + 1).join('☆');
        var date = (new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        var card = document.createElement('div');
        card.className = 'nx-comment';
        card.innerHTML =
          '<div class="nx-comment-head"><span class="nx-comment-name"></span><span class="nx-comment-date">' + date + '</span></div>' +
          '<div class="nx-comment-rating">' + stars + '</div>' +
          '<div class="nx-comment-text"></div>';
        card.querySelector('.nx-comment-name').textContent = name;
        card.querySelector('.nx-comment-text').textContent = text;
        if (listA) listA.insertBefore(card, listA.firstChild);
        formA.reset();
      });
    }

    // Pattern B (persisted): #nx-comment-form + storage + summary
    var LS_KEY = 'nxComments:' + (location.pathname || '/');
    var formB = $('#nx-comment-form');
    var listB = $('#nx-comments-list');
    var avgB = $('#nx-rating-avg');
    var countB = $('#nx-rating-count');
    var clearB = $('#nx-clear-comments');

    function read() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; } }
    function write(a) { try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch (e) {} }
    function sanitize(s) { return (s || '').toString().replace(/[<>]/g, ''); }
    function stars(n) { n = clamp(n, 0, 5); return Array(n + 1).join('★') + Array(5 - n + 1).join('☆'); }

    function renderB() {
      var all = read();
      if (listB) {
        listB.innerHTML = '';
        for (var i = 0; i < all.length; i++) {
          var it = all[i];
          var card = document.createElement('div');
          card.className = 'nx-comment';
          card.innerHTML =
            '<div class="nx-comment-head"><span class="nx-comment-name">' + sanitize(it.name) + '</span>' +
            '<span class="nx-comment-date">' + new Date(it.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '</span></div>' +
            '<div class="nx-comment-rating" aria-label="Rating ' + it.rating + ' out of 5">' + stars(it.rating) + '</div>' +
            '<p class="nx-comment-text">' + sanitize(it.text) + '</p>';
          listB.appendChild(card);
        }
      }
      var total = all.length;
      var avg = total ? (all.reduce(function (a, b) { return a + (Number(b.rating) || 0); }, 0) / total) : 0;
      if (avgB) avgB.textContent = total ? avg.toFixed(1) : '—';
      if (countB) countB.textContent = String(total);
    }

    if (formB) {
      renderB();
      on(formB, 'submit', function (e) {
        e.preventDefault();
        var name = ($('#nx-name') && $('#nx-name').value || '').trim();
        var text = ($('#nx-text') && $('#nx-text').value || '').trim();
        if (!name || !text) { alert('Please add your name and comment.'); return; }
        var rc = document.querySelector('input[name="rating"]:checked');
        var rating = rc ? Number(rc.value) : 1;
        var all = read();
        all.unshift({ name: name, text: text, rating: clamp(rating, 1, 5), ts: Date.now() });
        write(all);
        if ($('#nx-name')) $('#nx-name').value = '';
        if ($('#nx-text')) $('#nx-text').value = '';
        var r1 = $('#nx-star1'); if (r1) r1.checked = true;
        renderB();
      });
      on(clearB, 'click', function () {
        if (confirm('Clear all locally-saved comments?')) { try { localStorage.removeItem(LS_KEY); } catch (e) {} renderB(); }
      });
    }
  }

  /* ---------- theme switcher (persisted) ---------- */
  function bootTheme() {
    var themes = {
      emerald: {
        '--brand': '#10b981', '--brand-2': '#059669', '--brand-ink-strong': '#065f46',
        '--tab-active-bg': '#ecfdf5',
        '--badge-bg': '#ecfdf5', '--badge-br': '#d1fae5',
        '--link': '#065f46', '--link-hover': '#064e3b',
        '--ring': 'rgba(16,185,129,.22)',
        '--tools-bg': '#eefdf7', '--tools-br': '#b9f4e1', '--tools-accent': '#0d7a5a',
        '--facts-bg': '#eef4ff', '--facts-br': '#cbd9ff', '--facts-accent': '#2a53ad',
        '--voice-bg': '#fff7ee', '--voice-br': '#ffe0bd', '--voice-accent': '#b46312',
        '--accent-good': '#047857', '--accent-warn': '#b45309'
      },
      blue: {
        '--brand': '#3b82f6', '--brand-2': '#1d4ed8', '--brand-ink-strong': '#1e40af',
        '--tab-active-bg': '#eff6ff',
        '--badge-bg': '#eff6ff', '--badge-br': '#dbeafe',
        '--link': '#1d4ed8', '--link-hover': '#1e40af',
        '--ring': 'rgba(59,130,246,.22)',
        '--tools-bg': '#eff6ff', '--tools-br': '#dbeafe', '--tools-accent': '#1d4ed8',
        '--facts-bg': '#eef4ff', '--facts-br': '#cbd9ff', '--facts-accent': '#1e3a8a',
        '--voice-bg': '#f0f9ff', '--voice-br': '#bae6fd', '--voice-accent': '#0369a1',
        '--accent-good': '#2563eb', '--accent-warn': '#b45309'
      },
      violet: {
        '--brand': '#8b5cf6', '--brand-2': '#6d28d9', '--brand-ink-strong': '#5b21b6',
        '--tab-active-bg': '#f3f0ff',
        '--badge-bg': '#f3f0ff', '--badge-br': '#e9ddff',
        '--link': '#6d28d9', '--link-hover': '#5b21b6',
        '--ring': 'rgba(139,92,246,.22)',
        '--tools-bg': '#f5f3ff', '--tools-br': '#e9d5ff', '--tools-accent': '#6d28d9',
        '--facts-bg': '#eef4ff', '--facts-br': '#cbd9ff', '--facts-accent': '#4f46e5',
        '--voice-bg': '#fdf2f8', '--voice-br': '#fbcfe8', '--voice-accent': '#be185d',
        '--accent-good': '#7c3aed', '--accent-warn': '#b45309'
      },
      orange: {
        '--brand': '#f59e0b', '--brand-2': '#b45309', '--brand-ink-strong': '#92400e',
        '--tab-active-bg': '#fff7ed',
        '--badge-bg': '#fff7ed', '--badge-br': '#ffedd5',
        '--link': '#b45309', '--link-hover': '#92400e',
        '--ring': 'rgba(245,158,11,.22)',
        '--tools-bg': '#fff7ed', '--tools-br': '#ffedd5', '--tools-accent': '#b45309',
        '--facts-bg': '#fef3c7', '--facts-br': '#fde68a', '--facts-accent': '#a16207',
        '--voice-bg': '#fff1f2', '--voice-br': '#ffe4e6', '--voice-accent': '#be123c',
        '--accent-good': '#b45309', '--accent-warn': '#7c2d12'
      },
      rose: {
        '--brand': '#f43f5e', '--brand-2': '#be123c', '--brand-ink-strong': '#9f1239',
        '--tab-active-bg': '#fff1f2',
        '--badge-bg': '#fff1f2', '--badge-br': '#ffe4e6',
        '--link': '#be123c', '--link-hover': '#9f1239',
        '--ring': 'rgba(244,63,94,.22)',
        '--tools-bg': '#fff1f2', '--tools-br': '#ffe4e6', '--tools-accent': '#be123c',
        '--facts-bg': '#f3e8ff', '--facts-br': '#e9d5ff', '--facts-accent': '#7e22ce',
        '--voice-bg': '#f0f9ff', '--voice-br': '#bae6fd', '--voice-accent': '#0369a1',
        '--accent-good': '#e11d48', '--accent-warn': '#b45309'
      }
    };
    var root = document.documentElement.style;

    function applyTheme(name) {
      var t = themes[name]; if (!t) return;
      for (var k in t) { if (t.hasOwnProperty(k)) root.setProperty(k, t[k]); }
      try { localStorage.setItem('nxTheme', name); } catch (e) {}
      var mt = document.querySelector('meta[name="theme-color"]');
      if (!mt) { mt = document.createElement('meta'); mt.setAttribute('name', 'theme-color'); document.head.appendChild(mt); }
      mt.setAttribute('content', t['--tab-active-bg'] || t['--brand'] || '#ffffff');
    }

    var saved = null;
    try { saved = localStorage.getItem('nxTheme'); } catch (e) {}
    if (saved && themes[saved]) applyTheme(saved);

    var swatches = $all('.nx-theme-switcher .nx-swatch');
    for (var i = 0; i < swatches.length; i++) {
      on(swatches[i], 'click', function (e) { applyTheme(e.currentTarget.getAttribute('data-theme')); });
    }
  }

  /* ---------- external links hardening ---------- */
  function hardenExternal() {
    var els = $all('a.nx-external');
    for (var i = 0; i < els.length; i++) {
      if (!els[i].hasAttribute('target')) els[i].setAttribute('target', '_blank');
      var rel = (els[i].getAttribute('rel') || '').toLowerCase();
      if (rel.indexOf('noopener') === -1) els[i].setAttribute('rel', (rel ? rel + ' ' : '') + 'noopener');
    }
  }

  /* ---------- boot all ---------- */
  function init() {
    bootTabs();
    bootProgress();
    bootWordcount();
    bootCopy();
    bootVoice();
    bootComments();
    bootTheme();
    hardenExternal();
    // console.log('[NX] blog-core.js booted');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

