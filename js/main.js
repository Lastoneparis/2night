/* ============================================================
   2NIGHT — main.js
   Cinematic hero (particles + drifting parallax), signature
   interactive phone (auto-cycle + 3D cursor tilt), scroll
   reveals + parallax, stats count-up, kinetic cities, magnetic
   buttons, custom cursor, scroll progress, condensing nav,
   counter, city rotator, mobile nav, i18n + language switcher,
   waitlist modal. No frameworks. Vanilla JS.
   ============================================================ */
(function () {
  "use strict";

  var mqReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReduced = mqReduce && mqReduce.matches;
  var mqFine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");
  var canHover = mqFine ? mqFine.matches : false;
  var canMotion = !prefersReduced;
  var enableRichUI = canHover && canMotion; /* cursor, tilt, magnetic */

  function raf(fn) { return (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(fn); }

  /* ----------------------------------------------------------
     i18n
     window.TN_I18N is provided by js/translations.js (another worker).
     Falls back gracefully to the inline English copy if missing.
     ---------------------------------------------------------- */
  var I18N = window.TN_I18N || { en: {} };
  var DEFAULT_LANG = "en";

  // Human-readable names. Prefer each locale's own `lang_name` from
  // translations.js so every shipped language is labelled correctly.
  function langNames() {
    var fallback = {
      en: "English", fr: "Français", de: "Deutsch", es: "Español",
      it: "Italiano", pt: "Português", nl: "Nederlands", ru: "Русский",
      ar: "العربية", zh: "中文", ja: "日本語", ko: "한국어",
      tr: "Türkçe", pl: "Polski", sv: "Svenska", da: "Dansk",
      no: "Norsk", nb: "Norsk", fi: "Suomi", cs: "Čeština", el: "Ελληνικά",
      he: "עברית", hi: "हिन्दी", th: "ไทย", id: "Bahasa Indonesia",
      ms: "Bahasa Melayu", vi: "Tiếng Việt", uk: "Українська",
      ro: "Română", hu: "Magyar", bn: "বাংলা", ur: "اردو", sw: "Kiswahili"
    };
    var names = {};
    Object.keys(I18N).forEach(function (code) {
      var ln = I18N[code] && I18N[code].lang_name;
      names[code] = ln || fallback[code] || code.toUpperCase();
    });
    return names;
  }

  function availableLangs() { return Object.keys(I18N); }

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

    var nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(key, lang);
      if (val != null) el.textContent = val;
    });

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
      langBtn.setAttribute("aria-expanded", langEl.classList.contains("open") ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!langEl.contains(e.target)) closeLang();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLang();
    });
  }

  function closeLang() {
    if (langEl) langEl.classList.remove("open");
    if (langBtn) langBtn.setAttribute("aria-expanded", "false");
  }

  function updateLangUI(lang) {
    if (langCurrentEl) langCurrentEl.textContent = lang.toUpperCase();
    if (langMenu) {
      langMenu.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-lang") === lang);
      });
    }
  }

  /* ----------------------------------------------------------
     Sticky / condensing nav on scroll
     ---------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav-toggle");
    if (!nav) return;

    function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 24); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle) {
      toggle.addEventListener("click", function () { nav.classList.toggle("menu-open"); });
    }
  }

  /* ----------------------------------------------------------
     Hero badge animated counter
     ---------------------------------------------------------- */
  function animateNumber(el, target, duration, formatThousands) {
    var start = null;
    var from = Math.max(0, Math.round(target * 0.35));
    function fmt(n) { return formatThousands ? n.toLocaleString("en-US") : String(n); }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(Math.round(from + (target - from) * eased));
      if (p < 1) raf(step);
      else el.textContent = fmt(target);
    }
    raf(step);
  }

  function initCounter() {
    var el = document.getElementById("count");
    if (!el) return;
    var target = parseInt(el.getAttribute("data-target") || el.textContent, 10) || 247;
    if (prefersReduced) { el.textContent = target; return; }
    animateNumber(el, target, 1600, false);
  }

  /* ----------------------------------------------------------
     Stats band count-up (fires when visible)
     ---------------------------------------------------------- */
  function initStats() {
    var nums = document.querySelectorAll(".count-up");
    if (!nums.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      nums.forEach(function (el) {
        var tgt = parseInt(el.getAttribute("data-target"), 10) || 0;
        el.textContent = tgt.toLocaleString("en-US");
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var tgt = parseInt(el.getAttribute("data-target"), 10) || 0;
          animateNumber(el, tgt, 1700, tgt >= 1000);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
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
      if (document.hidden) return;
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
     Hero title — per-line staggered reveal on load
     ---------------------------------------------------------- */
  function initHeroTitle() {
    var title = document.querySelector(".hero-title");
    if (!title) return;
    if (prefersReduced) { title.classList.add("in"); return; }
    // next frame so the CSS initial state is committed first
    raf(function () { raf(function () { title.classList.add("in"); }); });
  }

  /* ----------------------------------------------------------
     Scroll reveal via IntersectionObserver
     (also a safety net for the native scroll-driven CSS so
      nothing can ever stay permanently hidden)
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
     Signature interactive phone:
       - auto-cycles real screenshots (crossfade ~2.8s)
       - tilts in 3D toward the cursor (desktop + motion only)
     ---------------------------------------------------------- */
  function initDevice() {
    var device = document.getElementById("device");
    var stage = document.getElementById("hero-stage");
    if (!device) return;

    // auto-cycle
    var imgs = device.querySelectorAll(".device-screen img");
    if (imgs.length > 1 && canMotion) {
      var idx = 0;
      setInterval(function () {
        if (document.hidden) return;
        imgs[idx].classList.remove("active");
        idx = (idx + 1) % imgs.length;
        imgs[idx].classList.add("active");
      }, 2800);
    }

    // 3D cursor tilt — desktop + non-reduced-motion only
    if (!enableRichUI || !stage) return;
    var rect = null, targetRX = 0, targetRY = 0, curRX = 0, curRY = 0, ticking = false;

    function measure() { rect = stage.getBoundingClientRect(); }
    measure();
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });

    function loop() {
      curRX += (targetRX - curRX) * 0.12;
      curRY += (targetRY - curRY) * 0.12;
      device.style.setProperty("--rx", curRX.toFixed(2) + "deg");
      device.style.setProperty("--ry", curRY.toFixed(2) + "deg");
      if (Math.abs(targetRX - curRX) > 0.01 || Math.abs(targetRY - curRY) > 0.01) {
        raf(loop);
      } else { ticking = false; }
    }
    function kick() { if (!ticking) { ticking = true; raf(loop); } }

    stage.addEventListener("mousemove", function (e) {
      if (!rect) measure();
      var px = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5..0.5
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      targetRY = px * 16;   // rotateY from horizontal
      targetRX = -py * 14;  // rotateX from vertical
      kick();
    });
    stage.addEventListener("mouseleave", function () {
      targetRX = 0; targetRY = 0; kick();
    });
  }

  /* ----------------------------------------------------------
     Lightweight scroll parallax for hero layers (rAF-throttled)
     ---------------------------------------------------------- */
  function initParallax() {
    if (!canMotion) return;
    var layers = [
      { el: document.querySelector(".hero-aurora"), k: 0.18 },
      { el: document.querySelector(".hero-glow"), k: 0.10 },
      { el: document.querySelector(".hero-copy"), k: 0.06 },
      { el: document.querySelector(".cities-bg"), k: 0.08, base: true }
    ].filter(function (l) { return l.el; });
    if (!layers.length) return;

    var ticking = false;
    function update() {
      var y = window.scrollY || window.pageYOffset;
      layers.forEach(function (l) {
        if (l.base) {
          // parallax against the section, not the page top
          var r = l.el.parentElement.getBoundingClientRect();
          var off = (window.innerHeight - r.top) * l.k;
          l.el.style.transform = "translate3d(0," + (-off * 0.12).toFixed(1) + "px,0)";
        } else {
          l.el.style.transform = "translate3d(0," + (y * l.k).toFixed(1) + "px,0)";
        }
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; raf(update); }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     Magnetic buttons (desktop + motion only)
     ---------------------------------------------------------- */
  function initMagnetic() {
    if (!enableRichUI) return;
    var els = document.querySelectorAll(".btn-magnetic");
    els.forEach(function (el) {
      var inner = el.querySelector("span");
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (mx * 0.18).toFixed(1) + "px," + (my * 0.28).toFixed(1) + "px)";
        if (inner) inner.style.transform = "translate(" + (mx * 0.10).toFixed(1) + "px," + (my * 0.14).toFixed(1) + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
        if (inner) inner.style.transform = "";
      });
    });
  }

  /* ----------------------------------------------------------
     Tier cards — gold glow follows the cursor
     ---------------------------------------------------------- */
  function initTiltGlow() {
    if (!enableRichUI) return;
    var cards = document.querySelectorAll("[data-tilt-glow]");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  }

  /* ----------------------------------------------------------
     Custom minimal cursor (desktop + non-reduced-motion only)
     ---------------------------------------------------------- */
  function initCursor() {
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    if (!dot || !ring || !enableRichUI) return;

    document.body.classList.add("cursor-on");
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var first = true;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      if (first) { rx = mx; ry = my; first = false; }
    }, { passive: true });

    (function ring_loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px) translate(-50%,-50%)";
      raf(ring_loop);
    })();

    var interactive = "a, button, input, [data-magnetic], [data-open-waitlist], .city, .screen-item, .tier-card";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(interactive)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(interactive)) document.body.classList.remove("cursor-hover");
    });
    // hide when leaving the window
    document.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-on"); });
    document.addEventListener("mouseenter", function () { document.body.classList.add("cursor-on"); });
  }

  /* ----------------------------------------------------------
     Cities marquee fallback toggle
     If reduced-motion, hide the moving marquee and show the
     static list so the city names are always present.
     ---------------------------------------------------------- */
  function initCities() {
    var marquee = document.querySelector("[data-marquee]");
    var staticList = document.querySelector("[data-static-cities]");
    if (!marquee || !staticList) return;
    if (prefersReduced) {
      marquee.style.display = "none";
      staticList.hidden = false;
    }
  }

  /* ----------------------------------------------------------
     Particle hero canvas (with subtle pointer drift)
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
    var px = 0, py = 0; // pointer offset

    var palette = ["255,215,0", "255,240,160", "192,192,192", "245,245,245"];

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
      var baseAlpha = (color.indexOf("255,215") === 0) ? rand(0.18, 0.6) : rand(0.06, 0.3);
      return {
        x: rand(0, w), y: rand(0, h),
        r: rand(0.5, 1.9),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.18, 0.05),
        depth: rand(0.3, 1),
        color: color, a: baseAlpha,
        tw: rand(0.002, 0.01), tp: Math.random() * Math.PI * 2
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
        var dx = p.x + px * p.depth;
        var dy = p.y + py * p.depth;

        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;

        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.color + "," + flicker.toFixed(3) + ")";
        ctx.arc(dx, dy, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.r > 1.3) {
          ctx.beginPath();
          ctx.fillStyle = "rgba(" + p.color + "," + (flicker * 0.15).toFixed(3) + ")";
          ctx.arc(dx, dy, p.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (running) rafId = raf(draw);
    }
    function start() { if (!running) { running = true; rafId = raf(draw); } }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

    resize(); build();

    if (prefersReduced) { running = false; draw(); return; }

    rafId = raf(draw);

    if (enableRichUI) {
      window.addEventListener("mousemove", function (e) {
        px = (e.clientX / window.innerWidth - 0.5) * 26;
        py = (e.clientY / window.innerHeight - 0.5) * 18;
      }, { passive: true });
    }

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
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (done) {
          var msg = t("waitlist_done", currentLang) || "You're on the list. See you tonight.";
          done.textContent = msg;
        }
        form.reset();
      });
    }
  }

  /* ----------------------------------------------------------
     Cookie consent banner
     Tasteful fixed bottom banner; persists the choice in
     localStorage so it never reappears once decided. Injected
     into every page so no per-page HTML is required.
     ---------------------------------------------------------- */
  function initCookieConsent() {
    var KEY = "tn_cookie_consent";
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (stored === "accepted" || stored === "declined") return;

    var banner = document.createElement("aside");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", t("cookie_aria", currentLang) || "Cookie consent");

    var text = t("cookie_text", currentLang) ||
      "We use cookies to keep 2NIGHT working and to understand how the site is used.";
    var privacyLabel = t("cookie_privacy_link", currentLang) || "Privacy & Cookies";
    var acceptLabel = t("cookie_accept", currentLang) || "Accept";
    var declineLabel = t("cookie_decline", currentLang) || "Essential only";

    // Resolve the privacy link relative to where we are (root vs sub-pages
    // are all flat here, so privacy.html is fine everywhere).
    banner.innerHTML =
      '<p class="cookie-text"><strong>2NIGHT</strong> · ' + escapeHtml(text) +
        ' <a href="privacy.html#cookies">' + escapeHtml(privacyLabel) + "</a></p>" +
      '<div class="cookie-actions">' +
        '<button type="button" class="btn btn-cookie-ghost" data-cookie="declined">' + escapeHtml(declineLabel) + "</button>" +
        '<button type="button" class="btn btn-gold" data-cookie="accepted"><span>' + escapeHtml(acceptLabel) + "</span></button>" +
      "</div>";

    document.body.appendChild(banner);
    // reveal next frame so the transition runs
    raf(function () { raf(function () { banner.classList.add("show"); }); });

    function decide(choice) {
      try { localStorage.setItem(KEY, choice); } catch (e) {}
      banner.classList.remove("show");
      setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 600);
    }

    banner.querySelectorAll("[data-cookie]").forEach(function (b) {
      b.addEventListener("click", function () { decide(b.getAttribute("data-cookie")); });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ----------------------------------------------------------
     Year in footer
     ---------------------------------------------------------- */
  function initYear() {
    var y = document.querySelectorAll("[data-year]");
    y.forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ----------------------------------------------------------
     React if the user flips the reduced-motion preference live.
     ---------------------------------------------------------- */
  function watchReducedMotion() {
    if (!mqReduce || !mqReduce.addEventListener) return;
    mqReduce.addEventListener("change", function () {
      // simplest, safest path: reload-free best-effort — ensure content visible
      if (mqReduce.matches) {
        document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
        var title = document.querySelector(".hero-title");
        if (title) title.classList.add("in");
        document.body.classList.remove("cursor-on", "cursor-hover");
      }
    });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  function boot() {
    buildLangMenu();
    applyLang(currentLang);
    initNav();
    initHeroTitle();
    initCounter();
    initStats();
    initCityRotator();
    initReveal();
    initDevice();
    initParallax();
    initMagnetic();
    initTiltGlow();
    initCursor();
    initCities();
    initParticles();
    initWaitlist();
    initCookieConsent();
    initYear();
    watchReducedMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
