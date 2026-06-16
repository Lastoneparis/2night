// =========================================================
// 2NIGHT — "Liquid Wipe" navigation transition (no framework)
//   Intercepts internal link clicks: 5 vertical strips rise to
//   cover the screen, then the browser navigates. Same-page
//   hash links smooth-scroll instead. Respects reduced motion.
// =========================================================
const gsap = window.gsap;
const STRIP_EASE = "io"; // cubic-bezier(0.76,0,0.24,1), registered in main.js

export function setupTransitions({ reduce, lenis }) {
  const strips = [...document.querySelectorAll(".transition-strip")];
  if (!gsap) return;

  function wipeCover() {
    return gsap.timeline().fromTo(strips,
      { clipPath: "inset(100% 0 0 0)" },
      { clipPath: "inset(0% 0 0 0)", duration: 0.55, ease: STRIP_EASE, stagger: 0.05 });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href) return;
    if (a.target === "_blank" || a.hasAttribute("download") || a.dataset.noWipe !== undefined) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (/^(mailto:|tel:)/.test(href)) return;

    let url;
    try { url = new URL(href, location.href); } catch { return; }

    // same-page hash → smooth scroll (no wipe)
    if (url.pathname === location.pathname && (url.hash || href.startsWith("#"))) {
      const target = url.hash && document.querySelector(url.hash);
      if (target) {
        e.preventDefault();
        if (lenis && !reduce) lenis.scrollTo(target, { offset: -60 });
        else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      }
      return;
    }

    if (url.origin !== location.origin) return;  // external → normal

    // internal navigation → liquid wipe, then go
    e.preventDefault();
    if (reduce || !strips.length) { window.location.href = url.href; return; }
    if (lenis) lenis.stop();
    wipeCover().then(() => { window.location.href = url.href; });
  });
}
