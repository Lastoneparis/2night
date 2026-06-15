/* ============================================================
   2NIGHT — V2 interactions
   Vanilla JS. Respects prefers-reduced-motion. Degrades gracefully.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var doc = document.documentElement;

  /* ---- hero entrance ---- */
  requestAnimationFrame(function () {
    document.body.classList.add("is-ready");
  });

  /* ---------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  revealEls.forEach(function (el) {
    var d = el.getAttribute("data-delay");
    if (d) el.style.setProperty("--rd", d + "ms");
  });

  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Nav scrolled state + scroll progress
  --------------------------------------------------------- */
  var nav = document.getElementById("nav");
  var progress = document.querySelector(".scroll-progress");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("scrolled", y > 24);
    if (progress) {
      var h = doc.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     Custom cursor + magnetic buttons (fine pointer only)
  --------------------------------------------------------- */
  if (finePointer && !reduced) {
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    if (dot && ring) {
      document.body.classList.add("cursor-on");
      var mx = 0, my = 0, rx = 0, ry = 0;
      window.addEventListener("mousemove", function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = "translate(" + (mx - 3) + "px," + (my - 3) + "px)";
      });
      (function loop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = "translate(" + (rx - 18) + "px," + (ry - 18) + "px)";
        requestAnimationFrame(loop);
      })();
      var hot = document.querySelectorAll("a, button, .magnetic, .price-card, .screen-card");
      hot.forEach(function (el) {
        el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-active"); });
        el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-active"); });
      });
    }

    /* magnetic pull on CTAs */
    var mags = document.querySelectorAll(".btn-magnetic");
    mags.forEach(function (btn) {
      var strength = 0.32;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + x * strength + "px," + y * strength + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------
     Hero device 3D tilt (fine pointer)
  --------------------------------------------------------- */
  var device = document.getElementById("device");
  var stage = document.getElementById("hero-stage");
  if (device && stage && finePointer && !reduced) {
    stage.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      device.style.transform = "rotateY(" + (-14 + px * 14) + "deg) rotateX(" + (5 - py * 12) + "deg)";
    });
    stage.addEventListener("mouseleave", function () {
      device.style.transform = "rotateY(-14deg) rotateX(5deg)";
    });
  }

  /* ---------------------------------------------------------
     Hero screen auto-cycle
  --------------------------------------------------------- */
  var screens = document.querySelectorAll("#device .device-screen img");
  if (screens.length > 1 && !reduced) {
    var idx = 0;
    setInterval(function () {
      screens[idx].classList.remove("active");
      idx = (idx + 1) % screens.length;
      screens[idx].classList.add("active");
    }, 3200);
  }

  /* ---------------------------------------------------------
     Count-up numbers
  --------------------------------------------------------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    if (reduced) { el.textContent = target.toLocaleString(); return; }
    var start = null, dur = 1400;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counts = document.querySelectorAll("[data-target]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { cio.observe(el); });
  } else {
    counts.forEach(animateCount);
  }

  /* ---------------------------------------------------------
     Full-page interactive background field
     Particles parallax with scroll velocity ("slide" pushes the
     field by depth), connect into constellations near the cursor,
     and gently repel the pointer. GPU-light; pauses when hidden.
  --------------------------------------------------------- */
  var bg = document.getElementById("bg-field");
  if (bg && !reduced) {
    var bx = bg.getContext("2d");
    var P = [], W2, H2, BRAF, dpr2;
    var lastY = window.scrollY || 0, kick = 0;
    var ptr = { x: -9999, y: -9999, on: false };

    function bsize() {
      dpr2 = Math.min(window.devicePixelRatio || 1, 2);
      W2 = window.innerWidth; H2 = window.innerHeight;
      bg.width = W2 * dpr2; bg.height = H2 * dpr2;
      bx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
      var n = Math.min(96, Math.floor((W2 * H2) / 16500));
      P = [];
      for (var i = 0; i < n; i++) {
        P.push({
          x: Math.random() * W2, y: Math.random() * H2,
          z: Math.random() * 0.75 + 0.25,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          a: Math.random() * 0.5 + 0.22,
          gold: Math.random() > 0.74
        });
      }
    }

    function bdraw() {
      bx.clearRect(0, 0, W2, H2);
      kick *= 0.9;
      var i, p;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        p.x += p.vx;
        p.y += p.vy - kick * 0.05 * p.z;          /* scroll "slide" pushes field by depth */
        if (p.x < -20) p.x = W2 + 20; else if (p.x > W2 + 20) p.x = -20;
        if (p.y < -20) p.y = H2 + 20; else if (p.y > H2 + 20) p.y = -20;
        if (ptr.on) {                              /* pointer repel */
          var dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 12000 && d2 > 0.5) {
            var f = (1 - d2 / 12000) * 1.6, dd = Math.sqrt(d2);
            p.x += dx / dd * f; p.y += dy / dd * f;
          }
        }
        var size = (p.gold ? 1.7 : 1.2) * p.z + 0.3;
        bx.beginPath();
        bx.arc(p.x, p.y, size, 0, 6.2832);
        bx.fillStyle = p.gold ? "rgba(255,215,0," + p.a + ")" : "rgba(229,228,226," + (p.a * 0.6) + ")";
        bx.fill();
      }
      if (ptr.on) {                                /* constellation lines near cursor */
        for (i = 0; i < P.length; i++) {
          p = P[i];
          var lx = p.x - ptr.x, ly = p.y - ptr.y, ld = lx * lx + ly * ly;
          if (ld < 20000) {
            bx.beginPath();
            bx.moveTo(ptr.x, ptr.y); bx.lineTo(p.x, p.y);
            bx.strokeStyle = "rgba(255,215,0," + (0.18 * (1 - ld / 20000)).toFixed(3) + ")";
            bx.lineWidth = 0.6; bx.stroke();
          }
        }
      }
      BRAF = requestAnimationFrame(bdraw);
    }

    bsize(); bdraw();

    window.addEventListener("scroll", function () {
      var y = window.scrollY || 0;
      kick += (y - lastY);
      if (kick > 46) kick = 46; else if (kick < -46) kick = -46;
      lastY = y;
      var hh = doc.scrollHeight - window.innerHeight;
      doc.style.setProperty("--scroll-prog", (hh > 0 ? y / hh : 0).toFixed(3));
    }, { passive: true });

    if (finePointer) {
      window.addEventListener("mousemove", function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; });
      window.addEventListener("mouseout", function (e) { if (!e.relatedTarget) ptr.on = false; });
    }

    var brt;
    window.addEventListener("resize", function () { clearTimeout(brt); brt = setTimeout(bsize, 200); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(BRAF); BRAF = null; }
      else if (!BRAF) { bdraw(); }
    });
  }

  /* ---------------------------------------------------------
     Smooth anchor scroll (respects reduced motion)
  --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });
  });
})();
