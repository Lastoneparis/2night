// =========================================================
// 2NIGHT V3 — orchestration
//  · Lenis smooth scroll  · GSAP + ScrollTrigger
//  · WebGL particle field (scroll-scrubbed across 5 states)
//  · Loader · custom cursor · magnetic buttons · fluid text morph
//  · SplitType char reveals · scroll-driven horizontal gallery
//  · liquid-wipe page transitions (transitions.js)
// All motion respects prefers-reduced-motion.
// =========================================================
import { setupTransitions } from "./transitions.js?v=20260616b";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const SplitType = window.SplitType;
const Lenis = window.Lenis;

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// "lite mode" — skip the heavy WebGL city (and never even download three.js) on
// low-power / data-saving / small-screen devices. They get the static city
// poster instead, which keeps the page fast (good Lighthouse performance).
const _conn = navigator.connection || {};
const lite = reduce
  || _conn.saveData === true
  || (navigator.hardwareConcurrency || 8) <= 4
  || window.matchMedia("(max-width: 860px)").matches;

if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

// ---- custom ease: cubic-bezier(0.76, 0, 0.24, 1) ----------------------------
function unitBezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sampX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampY = (t) => ((ay * t + by) * t + cy) * t;
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sampX(t) - x; if (Math.abs(e) < 1e-4) break;
      const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= e / d;
    }
    return sampY(t);
  };
}
if (gsap) gsap.registerEase("io", unitBezier(0.76, 0, 0.24, 1));

// =============================================================================
//  GLOBAL (once) SETUP
// =============================================================================
let lenis = null;
let particles = null;

function initLenis() {
  if (reduce || !Lenis) return null;
  const l = new Lenis({ duration: 1.15, smoothWheel: true,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  l.on("scroll", () => { if (ScrollTrigger) ScrollTrigger.update(); });
  gsap.ticker.add((time) => l.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return l;
}

// attach the scroll → camera-journey trigger once the city is live
function attachSceneScroll() {
  if (!particles) return;
  const pt = ScrollTrigger.create({
    trigger: document.body, start: "top top", end: "bottom bottom",
    scrub: 1, onUpdate: (self) => particles.setProgress(self.progress),
  });
  pageTriggers.push(pt);
  ScrollTrigger.refresh();
}

// load + start the WebGL city only on capable devices; three.js is dynamically
// imported so lite devices never download it. The static poster shows otherwise.
async function initSceneField() {
  const canvas = document.getElementById("gl");
  if (!canvas) return;
  if (lite) { canvas.style.display = "none"; return; }     // static poster only
  try {
    const { initCity } = await import("./city.js?v=20260616b");
    particles = initCity(canvas);
    attachSceneScroll();
  } catch (e) {
    console.warn("[2NIGHT] city scene failed", e);
    canvas.style.display = "none";
  }
}

// ---- custom cursor ----
function initCursor() {
  if (!finePointer || reduce) return;
  const ring = document.querySelector(".cursor-ring");
  const dot = document.querySelector(".cursor-dot");
  if (!ring || !dot) return;
  document.body.classList.add("has-cursor");
  const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
  const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2" });
  const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2" });
  window.addEventListener("pointermove", (e) => {
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  }, { passive: true });
  document.addEventListener("pointerover", (e) => {
    if (e.target.closest("a, button, .magnetic, [data-morph]")) ring.classList.add("is-hover");
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest("a, button, .magnetic, [data-morph]")) ring.classList.remove("is-hover");
  });
}

// ---- nav scrolled state + scroll progress bar ----
function initChrome() {
  const nav = document.getElementById("nav");
  const bar = document.querySelector(".scroll-progress span");
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", y > 40);
    if (bar) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  if (lenis) lenis.on("scroll", onScroll);
  onScroll();
}

// ---- magnetic buttons (proximity within 80px) ----
function initMagnetic() {
  if (reduce || !finePointer) return;
  const RADIUS = 80;
  const items = [...document.querySelectorAll(".magnetic")].map((el) => {
    const inner = el.querySelector(".magnetic-inner") || el;
    return {
      el, inner, active: false,
      ex: gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" }),
      ey: gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" }),
      ix: gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3" }),
      iy: gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3" }),
    };
  });
  if (!items.length) return;
  window.addEventListener("pointermove", (e) => {
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) / 2 + RADIUS;
      if (Math.hypot(dx, dy) < reach) {
        it.active = true;
        it.ex(dx * 0.3); it.ey(dy * 0.3);          // button toward cursor
        it.ix(dx * 0.5); it.iy(dy * 0.5);          // inner text moves more
      } else if (it.active) {
        it.active = false;
        gsap.to(it.el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
        gsap.to(it.inner, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.3)" });
      }
    }
  }, { passive: true });
}

// ---- fluid text morph (SVG feTurbulence + feDisplacementMap on hover) ----
function initMorph() {
  if (reduce) return;
  const turb = document.getElementById("liquidTurb");
  const disp = document.getElementById("liquidDisp");
  if (!turb || !disp) return;
  document.querySelectorAll("[data-morph]").forEach((el) => {
    let tl = null;
    const run = (toFreq, toScale) => {
      if (tl) tl.kill();
      const p = { bf: parseFloat(turb.getAttribute("baseFrequency")) || 0.0001,
                  sc: parseFloat(disp.getAttribute("scale")) || 0 };
      tl = gsap.to(p, {
        bf: toFreq, sc: toScale, duration: 0.55, ease: "power2.out",
        onUpdate: () => {
          turb.setAttribute("baseFrequency", `${p.bf} ${p.bf}`);
          disp.setAttribute("scale", p.sc);
        },
        onComplete: () => { if (toScale === 0) el.style.filter = ""; },
      });
    };
    el.addEventListener("pointerenter", () => { el.style.filter = "url(#liquid)"; run(0.04, 22); });
    el.addEventListener("pointerleave", () => run(0.0001, 0));
  });
}

// ---- cookie consent (shares localStorage key with the main 2night.co site) ----
function initCookieConsent() {
  const KEY = "tn_cookie_consent";
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }
  const banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML =
    '<p class="cookie-text"><strong>2NIGHT</strong> · We use only the cookies needed to make this site work and remember your preferences. No advertising or third-party tracking. ' +
    '<a href="/privacy.html#cookies">Privacy &amp; Cookies</a></p>' +
    '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-ghost" data-cookie="declined">Essential only</button>' +
      '<button type="button" class="btn btn-gold" data-cookie="accepted"><span class="magnetic-inner">Accept</span></button>' +
    "</div>";
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add("show"));
  const decide = (v) => {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    banner.classList.remove("show");
    setTimeout(() => banner.remove(), 520);
  };
  banner.querySelectorAll("[data-cookie]").forEach((b) =>
    b.addEventListener("click", () => decide(b.getAttribute("data-cookie"))));
}

// ---- i18n + language switcher (reuses window.TN_I18N from js/translations.js) --
const I18N = window.TN_I18N || null;
function initI18n() {
  if (!I18N) return;
  const DEF = "en";
  const RTL = ["ar", "he", "fa", "ur"];
  const has = (l) => I18N[l] != null;
  const tr = (key, lang) => {
    const L = I18N[lang] || {}; if (L[key] != null) return L[key];
    const e = I18N[DEF] || {}; return e[key] != null ? e[key] : null;
  };
  const stored = () => {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && has(q)) return q;
    try { const s = localStorage.getItem("tn_lang"); if (s && has(s)) return s; } catch (e) {}
    const n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return has(n) ? n : DEF;
  };
  const langEl = document.querySelector(".lang");
  const langBtn = document.querySelector(".lang-btn");
  const langMenu = document.querySelector(".lang-menu");
  const langCurrent = document.querySelector(".lang-current");
  function apply(lang) {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", RTL.includes(lang) ? "rtl" : "ltr");
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = tr(el.getAttribute("data-i18n"), lang); if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const v = tr(el.getAttribute("data-i18n-placeholder"), lang); if (v != null) el.setAttribute("placeholder", v);
    });
    try { localStorage.setItem("tn_lang", lang); } catch (e) {}
    if (langCurrent) langCurrent.textContent = lang.toUpperCase();
    if (langMenu) langMenu.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-lang") === lang));
    if (ScrollTrigger) ScrollTrigger.refresh();
  }
  if (langMenu) {
    const names = {}; Object.keys(I18N).forEach((c) => names[c] = (I18N[c] && I18N[c].lang_name) || c.toUpperCase());
    const codes = Object.keys(I18N).sort((a, b) => a === "en" ? -1 : b === "en" ? 1 : names[a].localeCompare(names[b]));
    const tick = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    langMenu.innerHTML = codes.map((c) => '<button type="button" data-lang="' + c + '"><span>' + names[c] + "</span>" + tick + "</button>").join("");
    langMenu.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => { apply(b.getAttribute("data-lang")); if (langEl) langEl.classList.remove("open"); }));
  }
  if (langBtn && langEl) {
    langBtn.addEventListener("click", (e) => { e.stopPropagation(); langEl.classList.toggle("open"); });
    document.addEventListener("click", (e) => { if (!langEl.contains(e.target)) langEl.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && langEl) langEl.classList.remove("open"); });
  }
  apply(stored());
}

// =============================================================================
//  PER-PAGE SETUP
// =============================================================================
let pageTriggers = [];
let pageSplits = [];
let cityTimer = 0;

function teardownPage() {
  pageTriggers.forEach((t) => t && t.kill && t.kill());
  pageSplits.forEach((s) => s && s.revert && s.revert());
  pageTriggers = [];
  pageSplits = [];
  if (cityTimer) { clearInterval(cityTimer); cityTimer = 0; }
}

// rotate the "out in <city> tonight" badge
function initCityRotator(scope) {
  const el = scope.querySelector("#cityName");
  if (!el || reduce) return;
  const cities = ["Zürich", "Paris", "London", "Dubai", "New York", "Berlin", "Lisbon", "Geneva"];
  let i = 0;
  cityTimer = setInterval(() => {
    i = (i + 1) % cities.length;
    gsap.to(el, { opacity: 0, y: -6, duration: 0.25, ease: "power2.in",
      onComplete: () => { el.textContent = cities[i];
        gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }); } });
  }, 2600);
}

function initPage(scope = document) {
  // 1 — char reveals (SplitType) on headings ------------------------------
  scope.querySelectorAll("[data-split]").forEach((el) => {
    el.style.perspective = "800px";
    let chars;
    if (SplitType && !reduce) {
      const split = new SplitType(el, { types: "chars,words" });
      pageSplits.push(split);
      chars = split.chars;
    }
    if (!chars || reduce) { gsap.set(el, { opacity: 1 }); return; }
    gsap.set(el, { opacity: 1 });
    gsap.set(chars, { transformOrigin: "50% 100%" });
    const tween = gsap.fromTo(chars,
      { yPercent: 110, opacity: 0, rotateX: 90 },
      { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.9, ease: "power3.out",
        stagger: 0.03,
        scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    if (tween.scrollTrigger) pageTriggers.push(tween.scrollTrigger);
  });

  // 2 — simple fade-up reveals --------------------------------------------
  scope.querySelectorAll("[data-reveal]").forEach((el) => {
    if (reduce) { gsap.set(el, { opacity: 1, y: 0 }); return; }
    const tween = gsap.fromTo(el,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    if (tween.scrollTrigger) pageTriggers.push(tween.scrollTrigger);
  });

  // 3 — scroll-driven horizontal gallery ----------------------------------
  const track = scope.querySelector("#galleryTrack");
  const pin = scope.querySelector(".gallery-pin");
  if (track && pin && !reduce) {
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: ".gallery", start: "top top", end: () => "+=" + dist(),
        pin, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    if (tween.scrollTrigger) pageTriggers.push(tween.scrollTrigger);

    // per-card parallax: inner image moves at ~60% speed (containerAnimation)
    scope.querySelectorAll(".card").forEach((card) => {
      const img = card.querySelector(".card-media img");
      if (!img) return;
      const p = gsap.fromTo(img, { xPercent: -6 }, {
        xPercent: 6, ease: "none",
        scrollTrigger: { trigger: card, containerAnimation: tween,
          start: "left right", end: "right left", scrub: true },
      });
      if (p.scrollTrigger) pageTriggers.push(p.scrollTrigger);
    });
  } else if (track && reduce) {
    track.style.flexWrap = "wrap";
    track.style.width = "auto";
  }

  // 4 — the WebGL city's scroll trigger is attached separately, once the scene
  //     finishes loading (see attachSceneScroll), so a slow three.js import
  //     never blocks the page content reveals below.

  initCityRotator(scope);

  ScrollTrigger.refresh();
}

// =============================================================================
//  LOADER (first visit only)
// =============================================================================
function runLoader(done) {
  const loader = document.getElementById("loader");
  const word = document.getElementById("loaderWord");
  const count = document.getElementById("loaderCount");
  const bar = document.getElementById("loaderBar");
  const seen = sessionStorage.getItem("2n_v3_seen");

  // secondary pages ship an empty, pre-hidden loader → skip cleanly
  if (!loader || !word || !count || !bar || seen || reduce) {
    if (loader) { loader.classList.add("is-done"); loader.style.display = "none"; }
    done(); return;
  }
  sessionStorage.setItem("2n_v3_seen", "1");
  if (lenis) lenis.stop();

  // split the word into chars
  const letters = word.textContent.split("");
  word.textContent = "";
  const spans = letters.map((ch) => {
    const s = document.createElement("span");
    s.className = "lchar"; s.textContent = ch; word.appendChild(s); return s;
  });

  const counter = { v: 0 };
  const tl = gsap.timeline({
    onComplete: () => {
      loader.classList.add("is-done"); loader.style.display = "none";
      if (lenis) lenis.start();
      done();
    },
  });
  tl.to(counter, { v: 100, duration: 2, ease: "power1.inOut",
    onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(2, "0"); } }, 0);
  tl.to(bar, { width: "100%", duration: 2, ease: "power1.inOut" }, 0);
  // chars fly out in random directions
  tl.to(spans, {
    duration: 0.5, ease: "power3.in", opacity: 0,
    y: () => gsap.utils.random(-300, 300),
    x: () => gsap.utils.random(-300, 300),
    rotation: () => gsap.utils.random(-90, 90),
    stagger: { each: 0.02, from: "random" },
  }, 2.0);
  tl.to([count, bar], { opacity: 0, duration: 0.3 }, 2.0);
}

// =============================================================================
//  BOOT
// =============================================================================
function boot() {
  if (!gsap || !ScrollTrigger) { console.warn("[2NIGHT] GSAP missing"); return; }
  lenis = initLenis();
  initSceneField();   // async; sets `particles` + attaches its scroll trigger when ready
  initCursor();
  initChrome();
  initMagnetic();
  initMorph();
  initCookieConsent();
  initI18n();

  runLoader(() => {
    initPage(document);
    // intro stagger on the hero of the entry page
    if (!reduce) {
      const hero = document.querySelector(".hero-inner");
      if (hero) gsap.from(hero.children, { y: 30, opacity: 0, duration: 0.9,
        ease: "power3.out", stagger: 0.08, delay: 0.05, clearProps: "all" });
    }
  });

  // liquid-wipe navigation transitions (single-page; links go to classic pages)
  setupTransitions({ reduce, lenis });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
