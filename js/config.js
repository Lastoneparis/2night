/* ============================================================================
   2NIGHT — site configuration
   ----------------------------------------------------------------------------
   THIS FILE IS THE SWITCH.

   The app is not on the App Store yet. Every "Download on the App Store"
   surface is already built and already in the markup — it is simply hidden.
   The waitlist shows in its place.

   ON RELEASE DAY, change exactly one word on the APP_STORE_LIVE line below
   from false to true, then run:

       bash tools/deploy_website.sh --apply

   That is the entire release action. No markup changes, no copy changes, no
   locale files to touch. Every App Store button on every page — homepage,
   /app, /account, /i/<code> invite landing, the sticky mobile bar — turns on
   together, and every waitlist form turns off together, atomically.

   TO PREVIEW THE POST-LAUNCH SITE WITHOUT DEPLOYING ANYTHING:
       https://2night.co/?appstore=1     forces the live state
       https://2night.co/?appstore=0     forces the pre-launch state
   The override lasts for that tab only and never affects other visitors.
   ============================================================================ */
(function () {
  "use strict";

  var CONFIG = {

    /* ---------------------------------------------------------------------
       ↓↓↓  THE ONLY LINE THAT CHANGES ON RELEASE DAY  ↓↓↓                  */
    APP_STORE_LIVE: false,
    /* ↑↑↑                                                              ↑↑↑
       Keep this false until the app is actually downloadable. Shipping it
       as true early sends real users to an Apple error page, which is worse
       than the waitlist.
       Verify before flipping:
         curl -s "https://itunes.apple.com/lookup?id=6780563413" | head -c 200
       It must report resultCount:1. While it reports 0, the listing is not
       live and this flag must stay false.
       --------------------------------------------------------------------- */

    // Apple product id for 2NIGHT. Real, allocated, and correct even while
    // the listing is unpublished — the Smart App Banner and the AASA rely on
    // it, so it is defined regardless of APP_STORE_LIVE.
    APP_STORE_ID: "6780563413",

    // Marketing slug in the store URL. Cosmetic; Apple resolves by id.
    APP_STORE_SLUG: "2night",

    // Android has no build and no listing. Kept false so no Play Store link
    // is ever rendered — the previous code sent Android users to a Play
    // listing for the iOS bundle id, which does not exist.
    PLAY_STORE_LIVE: false
  };

  // ---- derived -------------------------------------------------------------
  CONFIG.appStoreURL = function () {
    return "https://apps.apple.com/app/" + CONFIG.APP_STORE_SLUG +
           "/id" + CONFIG.APP_STORE_ID;
  };

  // ---- per-tab override, for previewing either state ------------------------
  // ASYMMETRIC ON PURPOSE.
  //
  // Forcing the state OFF (?appstore=0) is safe anywhere: the worst case is a
  // visitor sees the waitlist, which is the truth today.
  //
  // Forcing it ON is not. `?appstore=1` used to work on the public site, so
  // https://2night.co/?appstore=1 rendered the full "Download on the App Store"
  // state to anyone who typed it — for a listing that currently returns HTTP 404
  // (itunes lookup id=6780563413 → resultCount:0). That is an availability claim
  // the app cannot honour, reachable without any tooling, and it is the same
  // shape as the unguarded demo/screenshot flags that have cost this account a
  // 5.6 rejection before. So the ON direction is restricted to local and
  // preview hosts, where it is a development convenience and nothing else.
  var PREVIEW_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)$/i;
  var isPreviewHost = PREVIEW_HOST.test(window.location.hostname) ||
                      window.location.protocol === "file:";

  var forced = null;
  try {
    var q = new URLSearchParams(window.location.search);
    if (q.has("appstore")) {
      var want = q.get("appstore") !== "0";
      // Only the "off" direction is honoured in production.
      forced = (want && !isPreviewHost) ? null : want;
      if (forced !== null) {
        try { sessionStorage.setItem("tn_force_appstore", forced ? "1" : "0"); } catch (e) {}
      }
    } else {
      var s = null;
      try { s = sessionStorage.getItem("tn_force_appstore"); } catch (e) {}
      if (s !== null) {
        var stored = s === "1";
        forced = (stored && !isPreviewHost) ? null : stored;
      }
    }
  } catch (e) {}

  CONFIG.isLive = function () {
    return forced === null ? CONFIG.APP_STORE_LIVE === true : forced;
  };

  // ---- flip the document into the right state IMMEDIATELY -------------------
  // This file is loaded blocking in <head>, before any content paints, so the
  // page never flashes the wrong call-to-action. CSS does the hiding:
  //   [data-tn-when="live"]              → hidden by default
  //   html.tn-live [data-tn-when="live"] → shown
  // With JavaScript disabled neither class is set and the waitlist shows,
  // which is the correct pre-launch fallback.
  var root = document.documentElement;
  root.classList.add(CONFIG.isLive() ? "tn-live" : "tn-prelaunch");

  window.TN_CONFIG = CONFIG;

  // ---- fill in App Store hrefs once the DOM exists --------------------------
  function paint() {
    var url = CONFIG.appStoreURL();
    var nodes = document.querySelectorAll("[data-tn-appstore]");
    for (var i = 0; i < nodes.length; i++) nodes[i].setAttribute("href", url);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paint);
  } else {
    paint();
  }
})();
