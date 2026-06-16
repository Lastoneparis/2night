/* ============================================================
   2NIGHT — blog.js  (SCOPED blog i18n applier)
   --------------------------------------------------------------
   The shared site chrome (nav, footer, language menu, lang/dir
   on <html>) is handled by /v3/js/main.js using window.TN_I18N.
   This file ONLY localises the blog's own copy, which lives in a
   SEPARATE namespace: window.TN_BLOG_I18N (see blog-i18n.js).

   We never touch the shared translations.js. We piggy-back on the
   <html lang="…"> attribute — v3/main.js sets it whenever the user
   picks a language — and re-apply the blog strings on every change
   via a MutationObserver. This keeps the two i18n systems in sync
   with zero edits to shared code.

   Markup contract:
     <el data-blog-i18n="key">…</el>                  -> textContent
     <el data-blog-i18n="key" data-blog-html>…</el>   -> innerHTML (trusted)
     <meta data-blog-i18n="key" data-blog-attr="content">
                                                     -> sets that attribute
     <title data-blog-i18n="key">                     -> document.title
   ============================================================ */
(function () {
  "use strict";

  var DICT = window.TN_BLOG_I18N || {};
  var DEFAULT = "en";
  var RTL = ["ar", "he", "fa", "ur"];

  function hasLang(l) { return DICT[l] != null; }

  function pickLang() {
    // 1) explicit ?lang=
    try {
      var q = new URLSearchParams(window.location.search).get("lang");
      if (q && hasLang(q)) return q;
    } catch (e) {}
    // 2) the lang the chrome already resolved onto <html>
    var htmlLang = document.documentElement.getAttribute("lang");
    if (htmlLang && hasLang(htmlLang)) return htmlLang;
    // 3) stored choice (shared key with the rest of the site)
    try {
      var s = localStorage.getItem("tn_lang");
      if (s && hasLang(s)) return s;
    } catch (e) {}
    // 4) browser
    var n = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (hasLang(n)) return n;
    return DEFAULT;
  }

  function tr(key, lang) {
    var L = DICT[lang];
    if (L && L[key] != null) return L[key];
    var E = DICT[DEFAULT];
    if (E && E[key] != null) return E[key];
    return null;
  }

  function apply(lang) {
    // keep <html lang/dir> correct even on first paint (chrome may
    // not have run yet, or this locale may be blog-only).
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", RTL.indexOf(lang) !== -1 ? "rtl" : "ltr");

    var nodes = document.querySelectorAll("[data-blog-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute("data-blog-i18n");
      var val = tr(key, lang);
      if (val == null) continue;

      var attr = el.getAttribute("data-blog-attr");
      if (attr) {
        el.setAttribute(attr, val);
        // <title> still needs document.title kept in sync
        if (el.tagName === "TITLE") document.title = val;
        continue;
      }
      if (el.tagName === "TITLE") { document.title = val; el.textContent = val; continue; }
      if (el.hasAttribute("data-blog-html")) { el.innerHTML = val; }
      else { el.textContent = val; }
    }
  }

  var current = null;
  function sync() {
    var lang = pickLang();
    if (lang === current) return;
    current = lang;
    apply(lang);
  }

  function boot() {
    sync();

    // Re-apply whenever the chrome flips <html lang> (language menu click).
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () { sync(); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }

    // Defensive: also catch direct menu clicks in case attribute change
    // is coalesced before the observer is attached.
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".lang-menu button[data-lang]");
      if (!b) return;
      var l = b.getAttribute("data-lang");
      if (hasLang(l)) { current = l; apply(l); }
    });

    // cross-tab language changes
    window.addEventListener("storage", function (e) {
      if (e.key === "tn_lang") sync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
