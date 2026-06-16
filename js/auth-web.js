/* ============================================================================
 * 2NIGHT — auth-web.js
 * Supabase client + session logic for the web login / account portal.
 *
 * Authenticates against the SAME Supabase project the iOS app uses, so it is
 * the same users (public.users under RLS).
 *
 * Public anon key only — safe to ship in the browser. RLS protects the data.
 *
 * Loaded after the supabase-js v2 UMD bundle (window.supabase) and exposes a
 * single global: window.TNAuth.
 * ========================================================================== */
(function () {
  "use strict";

  /* --- Public config (anon key is safe in the browser; RLS enforces access) --- */
  var SUPABASE_URL = "https://ygsbrqfbaropfmczvlyy.supabase.co";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnc2JycWZiYXJvcGZtY3p2bHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTU0NjQsImV4cCI6MjA5NzEzMTQ2NH0.uc0MiyDrKpB3oTXvk5ZdOlf1gQGdvO4pl5iNB_L85IY";

  /* ------------------------------------------------------------------------ */

  function makeClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      return null;
    }
    try {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "tn-web-auth",
          flowType: "pkce"
        }
      });
    } catch (e) {
      return null;
    }
  }

  var client = makeClient();

  /* Normalise unknown errors into a short machine-readable code the UI can
     translate, plus the raw message for debugging. */
  function classify(err) {
    var msg = (err && (err.message || err.error_description || err.error)) || "";
    var low = String(msg).toLowerCase();
    var code = "generic";
    if (!client) code = "no_client";
    else if (low.indexOf("network") !== -1 || low.indexOf("fetch") !== -1 || low.indexOf("failed to fetch") !== -1) code = "network";
    else if (low.indexOf("rate") !== -1 || low.indexOf("too many") !== -1 || low.indexOf("for security purposes") !== -1) code = "rate_limited";
    else if (low.indexOf("expired") !== -1) code = "expired";
    else if (low.indexOf("invalid") !== -1 && (low.indexOf("otp") !== -1 || low.indexOf("token") !== -1 || low.indexOf("code") !== -1)) code = "bad_code";
    else if (low.indexOf("invalid") !== -1 && low.indexOf("email") !== -1) code = "bad_email";
    else if (low.indexOf("provider") !== -1 || low.indexOf("not enabled") !== -1 || low.indexOf("unsupported") !== -1) code = "provider_disabled";
    return { code: code, message: msg };
  }

  function emailLooksValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  var TNAuth = {
    ready: !!client,
    client: client,
    APP_STORE_URL: "https://apps.apple.com/app/id0000000000",
    SUBSCRIPTIONS_URL: "https://apps.apple.com/account/subscriptions",
    APP_HANDOFF_URL: "https://2night.co/app",

    isValidEmail: emailLooksValid,

    /* ----- Email OTP: step 1, send the code ----- */
    sendOtp: function (email) {
      if (!client) return Promise.resolve({ ok: false, error: { code: "no_client", message: "Supabase unavailable" } });
      email = String(email || "").trim();
      if (!emailLooksValid(email)) {
        return Promise.resolve({ ok: false, error: { code: "bad_email", message: "Invalid email" } });
      }
      return client.auth
        .signInWithOtp({
          email: email,
          options: {
            // shouldCreateUser:true lets brand-new emails sign up too; the iOS
            // app creates the public.users row via a trigger on auth signup.
            shouldCreateUser: true,
            emailRedirectTo: window.location.origin + "/account.html"
          }
        })
        .then(function (res) {
          if (res.error) return { ok: false, error: classify(res.error) };
          return { ok: true };
        })
        .catch(function (e) {
          return { ok: false, error: classify(e) };
        });
    },

    /* ----- Email OTP: step 2, verify the 6-digit code ----- */
    verifyOtp: function (email, token) {
      if (!client) return Promise.resolve({ ok: false, error: { code: "no_client", message: "Supabase unavailable" } });
      email = String(email || "").trim();
      token = String(token || "").trim().replace(/\s+/g, "");
      if (!token) return Promise.resolve({ ok: false, error: { code: "bad_code", message: "Empty code" } });
      return client.auth
        .verifyOtp({ email: email, token: token, type: "email" })
        .then(function (res) {
          if (res.error) return { ok: false, error: classify(res.error) };
          return { ok: true, session: res.data && res.data.session };
        })
        .catch(function (e) {
          return { ok: false, error: classify(e) };
        });
    },

    /* ----- Sign in with Apple (OAuth). Resolves with a redirect URL or an
            error; the login page hides the button when the provider is off. ----- */
    signInWithApple: function () {
      if (!client) return Promise.resolve({ ok: false, error: { code: "no_client", message: "Supabase unavailable" } });
      return client.auth
        .signInWithOAuth({
          provider: "apple",
          options: {
            redirectTo: window.location.origin + "/account.html",
            skipBrowserRedirect: false
          }
        })
        .then(function (res) {
          if (res.error) return { ok: false, error: classify(res.error) };
          return { ok: true, url: res.data && res.data.url };
        })
        .catch(function (e) {
          return { ok: false, error: classify(e) };
        });
    },

    /* Probe whether Apple OAuth is configured. We do NOT redirect; we ask the
       client to build the authorize URL with skipBrowserRedirect, then HEAD it.
       If the provider is disabled Supabase returns a 400 with "provider is not
       enabled", which we surface so the button can be hidden gracefully. */
    appleAvailable: function () {
      if (!client) return Promise.resolve(false);
      return client.auth
        .signInWithOAuth({
          provider: "apple",
          options: { redirectTo: window.location.origin + "/account.html", skipBrowserRedirect: true }
        })
        .then(function (res) {
          if (res.error) return false;
          var url = res.data && res.data.url;
          if (!url) return false;
          // The authorize endpoint 302->Apple when enabled, 400 (JSON error) when not.
          return fetch(url, { method: "GET", redirect: "manual" })
            .then(function (r) {
              // opaqueredirect / 3xx => enabled. 400/4xx => disabled.
              if (r.type === "opaqueredirect") return true;
              if (r.status >= 300 && r.status < 400) return true;
              if (r.status >= 400) return false;
              return true;
            })
            .catch(function () {
              // Network/CORS opacity: assume available rather than hide a working
              // button. A real 400 above resolves to false before reaching here.
              return true;
            });
        })
        .catch(function () {
          return false;
        });
    },

    /* ----- Session ----- */
    getSession: function () {
      if (!client) return Promise.resolve(null);
      return client.auth
        .getSession()
        .then(function (res) {
          return (res && res.data && res.data.session) || null;
        })
        .catch(function () {
          return null;
        });
    },

    onAuthChange: function (cb) {
      if (!client) return function () {};
      var sub = client.auth.onAuthStateChange(function (event, session) {
        cb(event, session);
      });
      return function () {
        try {
          sub.data.subscription.unsubscribe();
        } catch (e) {}
      };
    },

    signOut: function () {
      if (!client) return Promise.resolve({ ok: true });
      return client.auth
        .signOut()
        .then(function () {
          return { ok: true };
        })
        .catch(function () {
          return { ok: true };
        });
    },

    /* ----- Profile (public.users under RLS) ----- */
    /* Reads ONLY columns known to exist in the shipped schema. If a column is
       missing on a given deployment, Supabase 400s on the select; we retry with
       a minimal projection so the portal degrades instead of erroring. */
    fetchProfile: function (userId) {
      if (!client || !userId) return Promise.resolve(null);
      var full = "first_name, city, tier, photos, available_until, is_verified";
      return client
        .from("users")
        .select(full)
        .eq("id", userId)
        .maybeSingle()
        .then(function (res) {
          if (!res.error) return res.data || null;
          // Fall back to a minimal projection if the full one failed.
          return client
            .from("users")
            .select("first_name, city, tier")
            .eq("id", userId)
            .maybeSingle()
            .then(function (r2) {
              return r2.error ? null : r2.data || null;
            });
        })
        .catch(function () {
          return null;
        });
    },

    /* ----- Account deletion via the delete_my_account() RPC ----- */
    deleteAccount: function () {
      if (!client) return Promise.resolve({ ok: false, error: { code: "no_client", message: "Supabase unavailable" } });
      return client
        .rpc("delete_my_account")
        .then(function (res) {
          if (res.error) return { ok: false, error: classify(res.error) };
          return { ok: true };
        })
        .catch(function (e) {
          return { ok: false, error: classify(e) };
        });
    }
  };

  window.TNAuth = TNAuth;

  // Share the authenticated client with the sibling web→app handoff module
  // (js/app-handoff.js looks for window.TN_SUPABASE first). Exposing it here
  // means "Continue in the app" mints a handoff code from the SAME live session
  // (same storageKey) instead of a throwaway, logged-out client.
  if (client && !window.TN_SUPABASE) window.TN_SUPABASE = client;
})();
