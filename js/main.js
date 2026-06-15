/* ============================================================
   2NIGHT — main.js
   Particle hero, scroll reveals, counter, city rotator,
   mobile nav, i18n + language switcher, waitlist modal.
   No frameworks. Vanilla JS.
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     i18n
     window.TN_I18N is provided by js/translations.js (another worker).
     Falls back gracefully to the inline English copy if missing.
     ---------------------------------------------------------- */
  var I18N = window.TN_I18N || { en: {} };
  var DEFAULT_LANG = "en";

  function langNames() {
    // Optional human-readable names; falls back to the code uppercased.
    return {
      en: "English", fr: "Français", de: "Deutsch", es: "Español",
      it: "Italiano", pt: "Português", nl: "Nederlands", ru: "Русский",
      ar: "العربية", zh: "中文", ja: "日本語", ko: "한국어",
      tr: "Türkçe", pl: "Polski", sv: "Svenska", da: "Dansk",
      no: "Norsk", fi: "Suomi", cs: "Čeština", el: "Ελληνικά",
      he: "עברית", hi: "हिन्दी", th: "ไทย", id: "Bahasa Indonesia",
      vi: "Tiếng Việt", uk: "Українська", ro: "Română", hu: "Magyar"
    };
  }

  function availableLangs() {
    return Object.keys(I18N);
  }

  function getStoredLang() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("lang");
    if (q && I18N[q]) return q;
    try {
      var s = localStorage.getItem("tn_lang");
      if (s && I18N[s]) return s;
    } catch (e) {}
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (I18N[nav]) return nav;
    return DEFAULT_LANG;
  }

  function t(key, lang) {
    var L = I18N[lang] || {};
    if (L[key] != null) return L[key];
    var en = I18N[DEFAULT_LANG] || {};
    if (en[key] != null) return en[key];
    return null; // keep existing (inline) copy
  }

  var currentLang = getStoredLang();

  function applyLang(lang) {
    currentLang = lang;
    var rtl = ["ar", "he", "fa", "ur"].indexOf(lang) !== -1;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");

    // textContent for elements with data-i18n
    var nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(key, lang);
      if (val != null) el.textContent = val;
    });

    // placeholder for inputs with data-i18n-placeholder
    var phs = document.querySelectorAll("[data-i18n-placeholder]");
    phs.forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      var val = t(key, lang);
      if (val != null) el.setAttribute("placeholder", val);
    });

    try { localStorage.setItem("tn_lang", lang); } catch (e) {}
    updateLangUI(lang);
  }

  /* ---------- Language switcher UI ---------- */
  var langEl, langBtn, langMenu, langCurrentEl;

  function buildLangMenu() {
    langEl = document.querySelector(".lang");
    langBtn = document.querySelector(".lang-btn");
    langMenu = document.querySelector(".lang-menu");
    langCurrentEl = document.querySelector(".lang-current");
    if (!langEl || !langMenu) return;

    var names = langNames();
    var codes = availableLangs();
    // English first, then alphabetical by display name
    codes.sort(function (a, b) {
      if (a === "en") return -1;
      if (b === "en") return 1;
      return (names[a] || a).localeCompare(names[b] || b);
    });

    var tick = '<svg class="tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    langMenu.innerHTML = codes.map(function (c) {
      var label = names[c] || c.toUpperCase();
      return '<button type="button" data-lang="' + c + '"><span>' + label + "</span>" + tick + "</button>";
    }).join("");

    langMenu.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        applyLang(b.getAttribute("data-lang"));
        closeLang();
      });
    });

    langBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      langEl.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!langEl.contains(e.target)) closeLang();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLang();
    });
  }

  function closeLang() { if (langEl) langEl.classList.remove("open"); }

  function updateLangUI(lang) {
    var names = langNames();
    if (langCurrentEl) langCurrentEl.textContent = lang.toUpperCase();
    if (langMenu) {
      langMenu.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-lang") === lang);
      });
    }
  }

  /* ----------------------------------------------------------
     Sticky nav background on scroll
     ---------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav-toggle");
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle("scrolled", window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("menu-open");
      });
    }
  }

  /* ----------------------------------------------------------
     Animated counter (hero badge)
     ---------------------------------------------------------- */
  function initCounter() {
    var el = document.getElementById("count");
    if (!el) return;
    var target = parseInt(el.getAttribute("data-target") || el.textContent, 10) || 247;
    if (prefersReduced) { el.textContent = target; return; }

    var start = null;
    var duration = 1600;
    var from = Math.max(0, Math.round(target * 0.35));

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------
     City rotator (hero badge)
     ---------------------------------------------------------- */
  function initCityRotator() {
    var el = document.getElementById("city");
    var countEl = document.getElementById("count");
    if (!el) return;
    var cities = [
      { name: "Zürich", n: 247 },
      { name: "Paris", n: 612 },
      { name: "London", n: 938 },
      { name: "Dubai", n: 421 },
      { name: "New York", n: 1204 }
    ];
    if (prefersReduced) return;
    var i = 0;
    setInterval(function () {
      i = (i + 1) % cities.length;
      el.classList.add("fading");
      setTimeout(function () {
        el.textContent = cities[i].name;
        if (countEl) countEl.textContent = cities[i].n;
        el.classList.remove("fading");
      }, 400);
    }, 3600);
  }

  /* ----------------------------------------------------------
     Scroll reveal via IntersectionObserver
     ---------------------------------------------------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || prefersReduced) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var delay = parseFloat(el.getAttribute("data-delay") || "0");
          el.style.transitionDelay = delay + "ms";
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     Particle hero canvas
     ---------------------------------------------------------- */
  function initParticles() {
    var canvas = document.getElementById("particles");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var particles = [];
    var COUNT = 150;
    var running = true;
    var rafId = null;

    var palette = [
      "255,215,0",   // gold
      "255,240,160", // gold-light
      "192,192,192", // silver
      "245,245,245"  // white
    ];

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function makeParticle() {
      var color = palette[Math.floor(Math.random() * palette.length)];
      // gold-ish weighted brighter, others dimmer
      var baseAlpha = (color.indexOf("255,215") === 0) ? rand(0.18, 0.6) : rand(0.06, 0.3);
      return {
        x: rand(0, w), y: rand(0, h),
        r: rand(0.5, 1.9),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.18, 0.05), // slight upward drift
        color: color,
        a: baseAlpha,
        // gentle twinkle
        tw: rand(0.002, 0.01),
        tp: Math.random() * Math.PI * 2
      };
    }

    function build() {
      particles = [];
      var count = w < 600 ? 80 : COUNT;
      for (var i = 0; i < count; i++) particles.push(makeParticle());
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.tp += p.tw;
        var flicker = p.a * (0.7 + 0.3 * Math.sin(p.tp));

        // wrap-around
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;

        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.color + "," + flicker.toFixed(3) + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // soft glow for the brighter gold dots
        if (p.r > 1.3) {
          ctx.beginPath();
          ctx.fillStyle = "rgba(" + p.color + "," + (flicker * 0.15).toFixed(3) + ")";
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (running) rafId = requestAnimationFrame(draw);
    }

    function start() { if (!running) { running = true; rafId = requestAnimationFrame(draw); } }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

    resize(); build();

    if (prefersReduced) {
      // draw a single static frame, no animation
      running = false;
      draw();
      return;
    }

    rafId = requestAnimationFrame(draw);

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); build(); }, 200);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* ----------------------------------------------------------
     Waitlist modal
     ---------------------------------------------------------- */
  function initWaitlist() {
    var modal = document.getElementById("waitlist");
    if (!modal) return;
    var openers = document.querySelectorAll("[data-open-waitlist]");
    var overlay = modal.querySelector(".modal-overlay");
    var closeBtn = modal.querySelector(".modal-close");
    var form = modal.querySelector(".waitlist-form");
    var done = modal.querySelector(".waitlist-done");
    var input = modal.querySelector("input");

    function open(e) {
      if (e) e.preventDefault();
      modal.classList.add("open");
      setTimeout(function () { if (input) input.focus(); }, 250);
    }
    function close() { modal.classList.remove("open"); }

    openers.forEach(function (b) { b.addEventListener("click", open); });
    if (overlay) overlay.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (done) {
          done.textContent = "✓";
          // localized confirmation if a key exists, else a sensible default
          var msg = t("waitlist_done", currentLang) || "You're on the list. See you tonight.";
          done.textContent = msg;
        }
        form.reset();
      });
    }
  }

  /* ----------------------------------------------------------
     Year in footer
     ---------------------------------------------------------- */
  function initYear() {
    var y = document.querySelectorAll("[data-year]");
    y.forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  function boot() {
    buildLangMenu();
    applyLang(currentLang);
    initNav();
    initCounter();
    initCityRotator();
    initReveal();
    initParticles();
    initWaitlist();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
