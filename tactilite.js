/* ============================================================
   TACTILITE · shared interactions
   Reads two optional globals defined per-page BEFORE this file:
     window.TACTILITE_SHOTS   = [{src, title}]
     window.TACTILITE_UPDATES = [{version, date, title, tags:[{label,type}], points:[]}]
     window.TACTILITE_I18N    = { of, expand, shot }
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.add("js-anim");

  var I18N = Object.assign({ of: "of", expand: "View", shot: "Shot" }, window.TACTILITE_I18N || {});
  var onReady = function (fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  onReady(function () {
    /* ---------- NAV: scrolled state ---------- */
    var nav = document.querySelector(".site-nav");
    var setScrolled = function () {
      if (!nav) return;
      nav.classList.toggle("scrolled", window.scrollY > 24);
    };
    setScrolled();

    /* ---------- NAV: mobile toggle ---------- */
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          links.classList.remove("open");
          toggle.classList.remove("open");
        }
      });
    }

    /* ---------- HERO parallax ---------- */
    var heroBg = document.querySelector(".hero-bg");

    /* ---------- combined scroll handler ---------- */
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        setScrolled();
        if (heroBg) {
          var y = window.scrollY;
          if (y < window.innerHeight) heroBg.style.transform = "translateY(" + (y * 0.28) + "px) scale(1.06)";
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- REVEAL on scroll ---------- */
    var reveals = [].slice.call(document.querySelectorAll(".reveal"));
    if ("IntersectionObserver" in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("in"); });
    }

    /* ---------- COUNT-UP ---------- */
    var counted = false;
    var nums = [].slice.call(document.querySelectorAll("[data-count]"));
    var runCount = function () {
      if (counted || !nums.length) return;
      var band = nums[0].closest(".stats-band") || nums[0];
      var rect = band.getBoundingClientRect();
      if (rect.top > window.innerHeight - 80) return;
      counted = true;
      nums.forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1400, start = performance.now();
        var step = function (now) {
          var p = Math.min(1, (now - start) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * e) + (p === 1 ? suffix : "");
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };
    window.addEventListener("scroll", runCount, { passive: true });
    runCount();

    /* ---------- SCROLLSPY ---------- */
    var navAnchors = [].slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
    var spyTargets = navAnchors.map(function (a) {
      var id = a.getAttribute("href").slice(1);
      return { a: a, el: document.getElementById(id) };
    }).filter(function (t) { return t.el; });
    if (spyTargets.length && "IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            navAnchors.forEach(function (a) { a.classList.remove("active"); });
            var match = spyTargets.filter(function (t) { return t.el === en.target; })[0];
            if (match) match.a.classList.add("active");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      spyTargets.forEach(function (t) { spy.observe(t.el); });
    }

    /* ---------- GALLERY ---------- */
    var shots = window.TACTILITE_SHOTS || [];
    var galMain = document.getElementById("galMain");
    var galStrip = document.getElementById("galStrip");
    if (galMain && galStrip && shots.length) {
      var current = 0;
      var mainImg = galMain.querySelector("img");
      var capEl = galMain.querySelector(".cap b");
      var curEl = galMain.querySelector(".counter b");
      var totEl = galMain.querySelector(".counter .tot");

      shots.forEach(function (s, i) {
        var t = document.createElement("button");
        t.className = "thumb" + (i === 0 ? " active" : "");
        t.type = "button";
        t.innerHTML = '<img src="' + s.src + '" alt="' + s.title + '" loading="lazy">';
        t.addEventListener("click", function () { show(i); });
        galStrip.appendChild(t);
      });
      if (totEl) totEl.textContent = shots.length;

      var thumbs = [].slice.call(galStrip.querySelectorAll(".thumb"));
      function show(i) {
        current = (i + shots.length) % shots.length;
        var s = shots[current];
        mainImg.src = s.src;
        mainImg.alt = s.title;
        if (capEl) capEl.textContent = s.title;
        if (curEl) curEl.textContent = current + 1;
        thumbs.forEach(function (t, k) { t.classList.toggle("active", k === current); });
        if (lbOpen) updateLb();
        thumbs[current].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }

      /* lightbox */
      var lb = document.getElementById("lightbox");
      var lbImg = lb ? lb.querySelector("img") : null;
      var lbCap = lb ? lb.querySelector(".lb-cap") : null;
      var lbOpen = false;
      function updateLb() {
        if (!lbImg) return;
        var s = shots[current];
        lbImg.src = s.src; lbImg.alt = s.title;
        if (lbCap) lbCap.innerHTML = '<b>' + (current + 1) + '</b> ' + I18N.of + ' ' + shots.length + '  ·  ' + s.title;
      }
      function openLb() { if (!lb) return; lbOpen = true; updateLb(); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
      function closeLb() { if (!lb) return; lbOpen = false; lb.classList.remove("open"); document.body.style.overflow = ""; }

      galMain.addEventListener("click", openLb);
      if (lb) {
        lb.querySelector(".lb-close").addEventListener("click", closeLb);
        lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); show(current - 1); });
        lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); show(current + 1); });
        lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
        document.addEventListener("keydown", function (e) {
          if (!lbOpen) return;
          if (e.key === "Escape") closeLb();
          else if (e.key === "ArrowLeft") show(current - 1);
          else if (e.key === "ArrowRight") show(current + 1);
        });
      }
    }

    /* ---------- UPDATES FEED ---------- */
    var updates = window.TACTILITE_UPDATES || [];
    var feed = document.getElementById("feed");
    if (feed && updates.length) {
      feed.innerHTML = updates.map(function (u, i) {
        var tags = (u.tags || []).map(function (t) {
          return '<span class="tag ' + t.type + '">' + t.label + '</span>';
        }).join("");
        var points = (u.points || []).map(function (p) { return "<li>" + p + "</li>"; }).join("");
        return '' +
          '<div class="update reveal' + (i === 0 ? " latest" : "") + '">' +
            '<span class="node"></span>' +
            '<div class="update-card">' +
              '<div class="update-meta">' +
                '<span class="ver">' + u.version + '</span>' +
                '<span class="udate">' + u.date + '</span>' +
                tags +
              '</div>' +
              '<h4>' + u.title + '</h4>' +
              (points ? '<ul>' + points + '</ul>' : '') +
            '</div>' +
          '</div>';
      }).join("");

      /* re-observe newly injected reveals */
      if ("IntersectionObserver" in window) {
        var io2 = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io2.unobserve(en.target); } });
        }, { threshold: 0.1 });
        [].slice.call(feed.querySelectorAll(".reveal")).forEach(function (el) { io2.observe(el); });
      }

      /* hero badge -> latest version */
      var badgeVer = document.querySelector("[data-latest-version]");
      if (badgeVer && updates[0]) badgeVer.textContent = updates[0].version;
      var badgeTitle = document.querySelector("[data-latest-title]");
      if (badgeTitle && updates[0]) badgeTitle.textContent = updates[0].title;
    }
  });
})();
