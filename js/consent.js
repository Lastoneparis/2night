/* ============================================================================
   2NIGHT — cookie consent. THE ONLY implementation on the site.
   ----------------------------------------------------------------------------
   Before this file there were TWO consent banners with two different storage
   keys, and they did not cover the same pages:

     1. An inline #tn-cc block hardcoded into 17 HTML files. English only.
        Storage key: "tn_cookie_choice".
     2. initCookieConsent() inside /v3/js/main.js. Localised into all 35
        locales. Storage key: "tn_cookie_consent".

   Consequences: index.html loaded both and showed two stacked banners; the
   phone document (motion/index.html) had only the JS one; cookies.html,
   app.html and classic.html do not load main.js at all; and accepting one
   banner did not silence the other because the keys differed.

   This file replaces both. It is deliberately self-contained — it injects its
   own styles and falls back to English — so it can be dropped onto ANY page,
   including the ones that load neither the stylesheet nor translations.js.

   Storage key: "tn_cookie_consent"  ("accepted" | "declined")
   A pre-existing "tn_cookie_choice" value is honoured as an already-made
   decision, so nobody who already answered gets asked twice.
   ============================================================================ */
(function () {
  "use strict";

  var KEY = "tn_cookie_consent";
  var LEGACY_KEY = "tn_cookie_choice";

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Already decided — either under the current key or the one the old inline
  // banner used. Migrate the legacy value forward so this never re-prompts.
  var existing = read(KEY);
  if (!existing) {
    var legacy = read(LEGACY_KEY);
    if (legacy) {
      write(KEY, legacy === "accepted" ? "accepted" : "declined");
      existing = legacy;
    }
  }
  if (existing) return;

  // ---- localisation, with an English fallback for pages without the dict ----
  var FALLBACK = {
    cookie_text: "2NIGHT uses only the cookies needed to make this site work and remember your preferences. We don't load advertising or third-party tracking cookies.",
    cookie_accept: "Accept",
    cookie_decline: "Essential only",
    cookie_privacy_link: "Privacy & Cookies",
    cookie_aria: "Cookie consent"
  };
  function T(k) {
    var I = window.TN_I18N;
    var lang = document.documentElement.getAttribute("lang") || "en";
    if (I) {
      if (I[lang] && I[lang][k] != null) return I[lang][k];
      if (I.en && I.en[k] != null) return I.en[k];
    }
    return FALLBACK[k];
  }

  function start() {
    // ---- styles, scoped and self-contained -------------------------------
    // Uses the 2NIGHT tokens when the stylesheet is present and falls back to
    // literal values when it is not, so the banner looks right on every page.
    var css = document.createElement("style");
    css.textContent =
      '#tn-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:760px;' +
      'margin:0 auto;background:var(--overlay,#1E1B23);color:var(--ink,#ECE7E0);' +
      'border:1px solid var(--control-border,#757090);border-radius:16px;padding:18px 20px;' +
      'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Arial,sans-serif;' +
      'box-shadow:0 18px 50px rgba(0,0,0,.55);display:flex;flex-wrap:wrap;gap:14px;align-items:center;' +
      'opacity:0;transform:translateY(12px);transition:opacity .35s ease,transform .35s ease}' +
      '#tn-consent.show{opacity:1;transform:translateY(0)}' +
      '#tn-consent p{margin:0;flex:1 1 300px;font-size:13.5px;line-height:1.55;color:var(--ink-2,#A8A29B)}' +
      '#tn-consent a{color:var(--gold-ink,#F7D372);text-decoration:underline;text-underline-offset:2px}' +
      '#tn-consent .tn-row{display:flex;gap:10px;flex:0 0 auto}' +
      '#tn-consent button{border:0;border-radius:100px;padding:11px 20px;font-weight:700;' +
      'cursor:pointer;font-size:14px;font-family:inherit}' +
      /* gold FILL carries --on-fill text — the pair rule, 11.78:1 */
      '#tn-consent .tn-ok{background:var(--gold-fill,#F0C24B);color:var(--on-fill,#0B0A0D)}' +
      '#tn-consent .tn-ghost{background:transparent;color:var(--ink,#ECE7E0);' +
      'border:1px solid var(--control-border,#757090)}' +
      '@media (max-width:640px){#tn-consent .tn-row{width:100%}#tn-consent .tn-row button{flex:1}}' +
      '@media (prefers-reduced-motion: reduce){#tn-consent{transition:none}}';
    document.head.appendChild(css);

    var el = document.createElement("div");
    el.id = "tn-consent";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", T("cookie_aria"));
    el.setAttribute("data-i18n-aria-label", "cookie_aria");

    var p = document.createElement("p");
    var span = document.createElement("span");
    span.setAttribute("data-i18n", "cookie_text");
    span.textContent = T("cookie_text");
    var a = document.createElement("a");
    a.href = "/cookies";                      // extensionless: /cookies.html 301s
    a.setAttribute("data-i18n", "cookie_privacy_link");
    a.textContent = T("cookie_privacy_link");
    p.appendChild(span);
    p.appendChild(document.createTextNode(" "));
    p.appendChild(a);

    var row = document.createElement("div");
    row.className = "tn-row";
    var decline = document.createElement("button");
    decline.type = "button";
    decline.className = "tn-ghost";
    decline.setAttribute("data-i18n", "cookie_decline");
    decline.textContent = T("cookie_decline");
    var accept = document.createElement("button");
    accept.type = "button";
    accept.className = "tn-ok";
    accept.setAttribute("data-i18n", "cookie_accept");
    accept.textContent = T("cookie_accept");
    row.appendChild(decline);
    row.appendChild(accept);

    el.appendChild(p);
    el.appendChild(row);
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });

    function decide(v) {
      write(KEY, v);
      el.classList.remove("show");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }
    accept.addEventListener("click", function () { decide("accepted"); });
    decline.addEventListener("click", function () { decide("declined"); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
