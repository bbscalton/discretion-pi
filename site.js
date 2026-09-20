(function () {
  "use strict";

  /**
   * Intake promo — edit PROMO_END (ISO) to end early or extend.
   * Visible copy: Free Intake & case setup throughout October 2026.
   * Base price after promo: GYD$5,000.
   */
  var DISCRETION_INTAKE_PROMO = {
    /* PROMO_END: change this date to turn the promo off */
    end: "2026-10-31T23:59:59-04:00",
    monthLabel: "October 2026",
  };

  var promoActive =
    !isNaN(Date.parse(DISCRETION_INTAKE_PROMO.end)) &&
    Date.now() <= Date.parse(DISCRETION_INTAKE_PROMO.end);

  document.documentElement.classList.toggle("intake-promo-on", promoActive);
  document.documentElement.classList.toggle("intake-promo-off", !promoActive);

  document.querySelectorAll("[data-promo-month]").forEach(function (el) {
    el.textContent = DISCRETION_INTAKE_PROMO.monthLabel;
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll reveal + comic panel reveal */
  var reveals = document.querySelectorAll(".reveal, .panel-reveal");
  if (reveals.length && !reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Sticker-pop CTAs when they enter view */
  var stickers = document.querySelectorAll(".sticker-pop");
  if (stickers.length && !reduceMotion && "IntersectionObserver" in window) {
    var stickerIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-popped");
            stickerIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    stickers.forEach(function (el) {
      stickerIo.observe(el);
    });
  }

  /* Getting started: sticky Client / Field path highlight */
  var pathBtns = document.querySelectorAll(".path-sticky-btn[data-path]");
  var pathSections = document.querySelectorAll("[data-path-section]");
  if (pathBtns.length && pathSections.length) {
    function setActivePath(path) {
      pathBtns.forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-path") === path);
      });
    }

    if ("IntersectionObserver" in window) {
      var pathIo = new IntersectionObserver(
        function (entries) {
          var visible = entries
            .filter(function (e) {
              return e.isIntersecting;
            })
            .sort(function (a, b) {
              return b.intersectionRatio - a.intersectionRatio;
            })[0];
          if (visible) {
            setActivePath(visible.target.getAttribute("data-path-section"));
          }
        },
        { rootMargin: "-30% 0px -45% 0px", threshold: [0.1, 0.25, 0.5] }
      );
      pathSections.forEach(function (section) {
        pathIo.observe(section);
      });
    }

    if (location.hash === "#field") setActivePath("field");
    else if (location.hash === "#client") setActivePath("client");
  }

  /* Hero / atmosphere parallax */
  if (reduceMotion) return;

  var heroMedia = document.querySelector(".hero-media[data-parallax]");
  var heroImg = heroMedia && heroMedia.querySelector("img");
  var slowImgs = document.querySelectorAll("[data-parallax-slow]");

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      if (heroImg) {
        heroImg.style.transform = "translateY(" + Math.min(y * 0.28, 140) + "px)";
      }
      slowImgs.forEach(function (img) {
        var rect = img.parentElement.getBoundingClientRect();
        var mid = rect.top + rect.height / 2 - window.innerHeight / 2;
        img.style.transform = "translateY(" + mid * -0.08 + "px)";
      });
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
