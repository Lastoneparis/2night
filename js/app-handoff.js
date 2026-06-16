/*
 * 2NIGHT — web → app handoff  (website/js/app-handoff.js)
 * ---------------------------------------------------------------------------
 * Opens the native iOS app, already SIGNED IN, from an authenticated web
 * session — and falls back to the App Store if the app isn't installed.
 *
 * The app + website share ONE Supabase project (GoTrue identity). Sessions are
 * therefore already unified at the IDENTITY level: a user is the same auth.users
 * row on both. The only thing the "bridge" has to do is move a *session* from
 * the browser into the app without ever exposing a bearer token to the network,
 * the URL bar, history, referrers, or logs.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SECURITY MODEL — why no token is ever leaked
 * ──────────────────────────────────────────────────────────────────────────
 * We NEVER put the Supabase access_token or refresh_token in the handoff URL.
 * Those are long-lived bearer credentials; a URL is copied into history, server
 * logs, the `Referer` header, screenshots, and the OS clipboard. Instead we use
 * one of two flows, in order of preference. BOTH only ever transport an opaque,
 * single-use, short-TTL code that is worthless once redeemed.
 *
 *  FLOW A — Edge Function one-time code  (preferred; OPTIONAL backend)
 *  -----------------------------------------------------------------
 *    1. The browser (which already holds a valid Supabase session) calls the
 *       `app-handoff` Edge Function with its Authorization: Bearer <access_token>
 *       header. The token travels ONLY in the header, over TLS, to Supabase —
 *       never into a URL.
 *    2. The function verifies the caller, then mints a random 32-byte
 *       `code` stored server-side (table `app_handoff_codes`) bound to that
 *       user_id, single-use, TTL 120s.
 *    3. The browser deep-links:  twonight://auth/callback?code=<code>
 *       (and the universal-link equivalent https://2night.co/auth/callback?code=…)
 *    4. The app POSTs the code back to the same function (action=redeem). The
 *       function deletes the code (atomic single-use) and returns a freshly
 *       minted Supabase session (access + refresh) which the app installs with
 *       `supabase.auth.setSession(...)`. The code in the URL is now dead.
 *    => If the URL leaks, the worst case is a 120-second, already-redeemed,
 *       one-shot code that yields nothing.
 *
 *  FLOW B — Supabase magic-link / OTP  (zero-backend fallback)
 *  ----------------------------------------------------------
 *    If no Edge Function is deployed, we ask Supabase to email the signed-in
 *    user a normal magic link (`signInWithOtp`) whose `emailRedirectTo` is the
 *    universal link `https://2night.co/auth/callback`. The app opens that link,
 *    reads the `?code=` (PKCE) Supabase itself put there, and calls
 *    `exchangeCodeForSession(code)`. This is 100% Supabase-native, needs no
 *    custom backend, and again transports only Supabase's own single-use PKCE
 *    code — never a bearer token. The trade-off is the email round-trip.
 *
 * In BOTH flows the *only* thing in the deep link is a single-use code. The
 * access/refresh tokens are minted on the app side, locally, after redemption.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * APP-INSTALLED DETECTION
 * ──────────────────────────────────────────────────────────────────────────
 * iOS gives no reliable "is app installed" API to the web. We use the standard
 * visibility-race: try the deep link; if the page is still visible after a
 * short timeout (the app didn't take over), assume not installed and send the
 * user to the App Store. Universal Links (https://2night.co/app…) are tried
 * first because, when the app is installed, iOS routes them straight to the app
 * with NO visible Safari bounce; the custom scheme twonight:// is the fallback.
 *
 * This module exposes a single global: window.TwoNightHandoff.continueInApp().
 * It is intentionally dependency-light: it uses the global Supabase client if
 * the page has already created one (window.TN_SUPABASE or window.supabaseClient),
 * otherwise it degrades to the "open app, let the app handle auth" path.
 */
(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────────────────
  var CFG = {
    universalBase: "https://2night.co",          // Associated Domains host
    appScheme: "twonight://",                     // custom URL scheme fallback
    appStoreURL: "https://apps.apple.com/app/2night/id0000000000", // TODO: real id
    // Optional Edge Function (Flow A). If the project is not provisioned with it,
    // continueInApp() silently degrades to Flow B / plain open.
    handoffFnURL: "https://ygsbrqfbaropfmczvlyy.supabase.co/functions/v1/app-handoff",
    supabaseURL: "https://ygsbrqfbaropfmczvlyy.supabase.co",
    // Anon key — PUBLIC by design; safe in client code, identical to the app's.
    supabaseAnonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnc2JycWZiYXJvcGZtY3p2bHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTU0NjQsImV4cCI6MjA5NzEzMTQ2NH0.uc0MiyDrKpB3oTXvk5ZdOlf1gQGdvO4pl5iNB_L85IY",
    storeFallbackMs: 1400 // how long to wait for the app to take over
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  function isiOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function isAndroid() { return /Android/i.test(navigator.userAgent); }

  // Locate an already-initialised Supabase client on the page, if any.
  // (login.html / auth-web.js own client creation — we only borrow it.)
  function getSupabase() {
    if (window.TN_SUPABASE) return window.TN_SUPABASE;
    if (window.supabaseClient) return window.supabaseClient;
    // Last resort: build a throwaway client IF the UMD lib is present.
    if (window.supabase && typeof window.supabase.createClient === "function") {
      try {
        return window.supabase.createClient(CFG.supabaseURL, CFG.supabaseAnonKey, {
          auth: { flowType: "pkce", persistSession: false, detectSessionInUrl: false }
        });
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  // Open a deep link without navigating the current document away (so our
  // fallback timer can still fire). Universal links use a top-level navigation
  // because iOS only app-routes them from a user gesture / real navigation.
  function openURL(url, viaIframe) {
    if (viaIframe) {
      var f = document.createElement("iframe");
      f.style.display = "none";
      f.src = url;
      document.body.appendChild(f);
      setTimeout(function () { try { document.body.removeChild(f); } catch (e) {} }, 800);
    } else {
      window.location.href = url;
    }
  }

  // Race the deep link against a timer; if we're still here, go to the store.
  function tryOpenThenStore(deepLink, storeURL) {
    var bailed = false;
    function onHide() { bailed = true; }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) onHide();
    });
    window.addEventListener("pagehide", onHide);
    window.addEventListener("blur", onHide);

    openURL(deepLink, false);

    setTimeout(function () {
      // Try the custom scheme too (some configs prefer it) before giving up.
      if (!bailed && !document.hidden) {
        openURL(CFG.appScheme + deepLink.replace(/^https?:\/\/[^/]+\//, ""), true);
      }
    }, 350);

    setTimeout(function () {
      if (!bailed && !document.hidden && storeURL) {
        window.location.href = storeURL;
      }
    }, CFG.storeFallbackMs);
  }

  // ── FLOW A: mint a one-time handoff code via the Edge Function ──────────────
  // Returns a Promise<string|null> (the opaque code) — null ⇒ unavailable.
  function mintHandoffCode(accessToken) {
    if (!accessToken) return Promise.resolve(null);
    return fetch(CFG.handoffFnURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken, // token ONLY in header, over TLS
        "apikey": CFG.supabaseAnonKey
      },
      body: JSON.stringify({ action: "issue" })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.code) ? j.code : null; })
      .catch(function () { return null; });
  }

  // ── FLOW B: zero-backend Supabase magic-link to the app ─────────────────────
  function sendMagicLinkToApp(sb, email) {
    if (!sb || !email) return Promise.resolve(false);
    return sb.auth
      .signInWithOtp({
        email: email,
        options: {
          // PKCE code lands on this universal link → app exchanges it.
          emailRedirectTo: CFG.universalBase + "/auth/callback?platform=ios",
          shouldCreateUser: false
        }
      })
      .then(function (res) { return !res.error; })
      .catch(function () { return false; });
  }

  /**
   * continueInApp(opts)
   *  - opts.onStatus(stateString)  optional UI callback:
   *      "opening" | "emailed" | "store" | "no-session"
   *  - opts.storeURL               override the App Store URL
   * Resolves once a handoff path has been initiated.
   */
  function continueInApp(opts) {
    opts = opts || {};
    var status = typeof opts.onStatus === "function" ? opts.onStatus : function () {};
    var storeURL = opts.storeURL || CFG.appStoreURL;

    if (isAndroid()) {
      // Android app is "coming soon" — there is no deep target yet.
      status("store");
      window.location.href =
        "https://play.google.com/store/apps/details?id=com.twonightapp.ios";
      return Promise.resolve();
    }

    var sb = getSupabase();

    // No client on the page → just open the app; the app will own auth itself.
    if (!sb) {
      status("opening");
      tryOpenThenStore(CFG.universalBase + "/open", storeURL);
      return Promise.resolve();
    }

    return sb.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;

      // Logged out on web → nothing to hand off; open the app's own sign-in.
      if (!session) {
        status("no-session");
        tryOpenThenStore(CFG.universalBase + "/open", storeURL);
        return;
      }

      // FLOW A — preferred: opaque one-time code in the deep link.
      return mintHandoffCode(session.access_token).then(function (code) {
        if (code) {
          status("opening");
          var link =
            CFG.universalBase + "/auth/callback?code=" +
            encodeURIComponent(code) + "&platform=ios";
          tryOpenThenStore(link, storeURL);
          return;
        }

        // FLOW B — fallback: Supabase magic-link emailed to the user.
        var email = session.user && session.user.email;
        return sendMagicLinkToApp(sb, email).then(function (sent) {
          if (sent) {
            status("emailed");
          } else {
            // Last resort — open the app and let it prompt for sign-in.
            status("opening");
            tryOpenThenStore(CFG.universalBase + "/open", storeURL);
          }
        });
      });
    });
  }

  window.TwoNightHandoff = {
    continueInApp: continueInApp,
    isiOS: isiOS,
    isAndroid: isAndroid,
    config: CFG
  };
})();
