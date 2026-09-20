(function () {
  "use strict";

  /**
   * Storyboard chapters — drop a real story later by setting status: "live"
   * and href to the chapter URL (or keep href null and use #id anchors).
   * cover paths are relative to website/.
   */
  var DISCRETION_STORIES = [
    {
      id: "the-alibi",
      chapter: "Chapter 01",
      title: "The Alibi",
      tagline: "She said she was at work. The clock said otherwise.",
      cover: "images/story-cover-alibi.png",
      status: "live",
      href: "./the-alibi.html",
    },
    {
      id: "seen-together",
      chapter: "Chapter 02",
      title: "Seen Together",
      tagline: "One market street. Two shadows that shouldn’t match.",
      cover: "images/story-cover-seen-together.png",
      status: "live",
      href: "./seen-together.html",
    },
    {
      id: "love-bomb-reset",
      chapter: "Chapter 03",
      title: "Love Bomb Reset",
      tagline: "Too many roses. Too little truth.",
      cover: "images/story-cover-love-bomb.png",
      status: "coming-soon",
      href: null,
    },
    {
      id: "gaslight-hour",
      chapter: "Chapter 04",
      title: "Gaslight Hour",
      tagline: "If the story keeps changing, write the time down.",
      cover: "images/story-cover-gaslight.png",
      status: "coming-soon",
      href: null,
    },
    {
      id: "two-phones",
      chapter: "Chapter 05",
      title: "Two Phones",
      tagline: "One pocket. Two glowing secrets.",
      cover: "images/story-cover-two-phones.png",
      status: "coming-soon",
      href: null,
    },
    {
      id: "hotel-lobby",
      chapter: "Chapter 06",
      title: "Hotel Lobby",
      tagline: "Brass lights. A name that isn’t yours on the book.",
      cover: "images/story-cover-hotel-lobby.png",
      status: "coming-soon",
      href: null,
    },
    {
      id: "witness-said",
      chapter: "Chapter 07",
      title: "Witness Said",
      tagline: "Someone saw. Someone’s ready to say it.",
      cover: "images/story-cover-witness.png",
      status: "coming-soon",
      href: null,
    },
    {
      id: "soft-launch-lie",
      chapter: "Chapter 08",
      title: "Soft Launch Lie",
      tagline: "Pretty post. Empty smile. Soft launch, hard truth.",
      cover: "images/story-cover-soft-launch.png",
      status: "coming-soon",
      href: null,
    },
  ];

  function renderStoriesGrid() {
    var grid = document.querySelector("[data-stories-grid]");
    if (!grid) return;

    grid.innerHTML = "";
    DISCRETION_STORIES.forEach(function (story) {
      var isLive = story.status === "live" && story.href;
      var el = document.createElement(isLive ? "a" : "article");
      el.className = "story-card reveal" + (isLive ? "" : " is-coming-soon");
      el.id = story.id;
      el.setAttribute("data-story-id", story.id);
      el.setAttribute("data-status", story.status || "coming-soon");
      if (isLive) {
        el.href = story.href;
        el.setAttribute("aria-label", story.title + " — read chapter");
      } else {
        el.setAttribute("aria-label", story.title + " — coming soon");
      }

      var stampLabel = isLive ? "New" : "Coming soon";
      el.innerHTML =
        '<div class="story-card-cover">' +
        '<span class="story-card-stamp" data-status="' +
        (isLive ? "live" : "coming-soon") +
        '">' +
        stampLabel +
        "</span>" +
        '<img src="' +
        story.cover +
        '" alt="" width="600" height="800" loading="lazy" />' +
        "</div>" +
        '<div class="story-card-body">' +
        '<span class="story-card-chapter">' +
        story.chapter +
        "</span>" +
        "<h3 class=\"story-card-title\">" +
        story.title +
        "</h3>" +
        '<p class="story-card-tagline">' +
        story.tagline +
        "</p>" +
        '<span class="story-card-cta">' +
        (isLive ? "Read chapter →" : "Chapter dropping soon") +
        "</span>" +
        "</div>";

      grid.appendChild(el);
    });
  }

  renderStoriesGrid();

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
