"use strict";

(() => {
  // Web-ready copies of the six supplied photos; original uploads are unchanged.
  // Empty or unavailable photo paths fall back to the illustrated keepsake.
  const scenes = [
    {
      photo: "assets/photos/moment-01.webp",
      alt: "Khushboo taking a mirror selfie in a blue denim shirt, with a pink phone case",
      label: "a little hello",
      heading: "Some people just\nglow differently.",
      message: "Diwali ki lights bhi tumhari smile ke saamne fail hain ✨",
      note: "Aur tum? Tum toh poora festival ho.",
      caption: "the one who lights it up",
      placeholder: "your sunshine",
      artwork: "diya",
      presentation: "ribbon",
      stickerNote: "the main character ✨",
      symbol: "♡",
    },
    {
      photo: "assets/photos/moment-02.webp",
      alt: "Khushboo looking toward the camera beside a waterfall wall, wearing a grey top",
      label: "a tiny confession",
      heading: "The diyas have\nsome competition.",
      message: "Diye toh bahut cute hain… par tumse thode kam 🪔",
      note: "Bas keh diya. Ab sharmaana allowed hai.",
      caption: "a smile worth celebrating",
      placeholder: "that little smile",
      artwork: "flower",
      presentation: "confession",
      stickerNote: "officially too cute",
      symbol: "✳",
    },
    {
      photo: "assets/photos/moment-03.webp",
      alt: "Khushboo taking a mirror selfie in a red embroidered outfit, with softly backlit hair",
      label: "just one more?",
      heading: "One little moment.\nNot nearly enough.",
      message: "Ek aur photo, kyunki ek baar mein dil kahan bharta hai? 🤭",
      note: "Tumhari cuteness ke liye extra space toh banta hai.",
      caption: "a little more of you",
      placeholder: "a lovely moment",
      artwork: "moon",
      presentation: "moon",
      stickerNote: "written in the stars",
      symbol: "☾",
    },
    {
      photo: "assets/photos/moment-04.webp",
      alt: "Khushboo smiling in a garden beneath a golden sunset, wearing a burgundy top and jeans",
      label: "a little sparkle",
      heading: "That glow?\nEntirely your own.",
      message: "Tumhara festive glow? Thoda unfair competition hai 💫",
      note: "Fairy lights bhi tips maang rahi hain.",
      caption: "our favourite kind of sparkle",
      placeholder: "your festive glow",
      artwork: "sparkle",
      presentation: "sunburst",
      stickerNote: "golden hour looks like you",
      symbol: "✦",
    },
    {
      photo: "assets/photos/moment-05.webp",
      alt: "Khushboo smiling over their shoulder in a cream top and pearl earrings, with warm golden backlighting",
      label: "something sweet",
      heading: "Sweeter than\nthe mithai box.",
      message: "Mithai se bhi sweet koi hai… naam bataun? Tum 💛",
      note: "Khushboo, tum toh sweetness ka bonus pack ho.",
      caption: "a little extra sweetness",
      placeholder: "something sweet",
      artwork: "sweet",
      presentation: "sweet",
      stickerNote: "extra sweet. no sharing.",
      symbol: "♡",
    },
    {
      photo: "assets/photos/moment-06.webp",
      alt: "Khushboo posing in a burgundy sleeveless top, with one hand in their hair",
      label: "one wish, just for you",
      heading: "Happy Diwali,\nKhushboo.",
      message: "Tumhari Diwali roshni, mithaas aur smiles se bhari rahe. Happy Diwali! 🪔💛",
      note: "Hamesha aise hi chamakti rehna. You make the world lovelier.",
      caption: "a wish wrapped in a little love",
      placeholder: "a beautiful Diwali",
      artwork: "letter",
      presentation: "letter",
      stickerNote: "a wish, wrapped in love",
      symbol: "♡",
    },
  ];

  // One supplied local background video; set empty to use the static background.
  const mediaConfig = { backgroundVideo: "assets/video/background.mp4" };

  const $ = (id) => document.getElementById(id);
  const experience = $("experience");
  const photo = $("scene-photo");
  const placeholder = $("photo-placeholder");
  const nextButton = $("next-button");
  const card = $("photo-card");
  const backdrop = $("spotlight-backdrop");
  const stickerLayer = $("sticker-layer");
  const motionToggle = $("motion-toggle");
  const video = $("background-video");
  const videoBackground = $("video-background");
  const progress = Array.from($("progress-dots").children);
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const artworkNames = {
    diya: "A glowing diya surrounded by flowers",
    flower: "A pink flower with a little smiling face",
    moon: "A golden crescent moon and tiny stars",
    sparkle: "A golden sparkle with little pink hearts",
    sweet: "A gift box of golden Diwali sweets",
    letter: "A pink envelope sealed with a heart",
  };
  let currentScene = 0;
  let isTransitioning = false;
  let photoVersion = 0;
  let cachedPhotoPath = "";
  let cachedPhoto = null;
  let userPausedMotion = false;
  let activeReveal = null;
  let videoFailed = false;
  let playbackVersion = 0;
  let messageFrame = null;
  let finalePlayed = false;
  const atmosphere = createAtmosphere();
  const activeStickers = new Set();
  const stickerSets = [
    ["💖", "✦", "🎀", "🌸", "sunshine"],
    ["🌸", "💕", "✨", "🎀", "too cute"],
    ["🌙", "💗", "✧", "🌷", "one more?"],
    ["✨", "🌟", "💖", "🎀", "that glow!"],
    ["💛", "🌸", "💕", "🧁", "sweetest"],
    ["🪔", "💖", "✨", "🌷", "for you ♡"],
  ];

  function motionEnabled() {
    return !userPausedMotion && !motionPreference.matches;
  }

  function createAtmosphere() {
    const canvas = $("festival-atmosphere");
    const noop = { sync() {}, resize() {}, celebrate() {}, clearCelebration() {} };
    if (!canvas || !window.requestAnimationFrame || !window.cancelAnimationFrame) return noop;
    let ctx;
    try { ctx = canvas.getContext("2d"); } catch { return noop; }
    if (!ctx) return noop;

    let width = 0;
    let height = 0;
    let frame = null;
    let previousTime = null;
    let elapsed = 0;
    let celebrationAge = 0;
    let confetti = [];
    let lights = [];

    function clearCelebration() {
      confetti = [];
      celebrationAge = 0;
      canvas.classList.remove("is-celebrating");
    }

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      lights = Array.from({ length: 24 }, (_, index) => ({
        x: ((index * 137 + 37) % 997) / 997 * width,
        y: ((index * 83 + 61) % 991) / 991 * height,
        radius: 1 + index % 3,
        speed: 5 + index % 7,
        phase: index * 1.7,
      }));
      clearCelebration();
    }

    function draw(time) {
      frame = null;
      if (!motionEnabled() || document.hidden) {
        sync();
        return;
      }
      const dt = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, .05);
      previousTime = time;
      elapsed += dt;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f5bb51";
      lights.forEach(light => {
        light.y -= light.speed * dt;
        if (light.y < -8) light.y = height + 8;
        ctx.globalAlpha = .2 + .22 * (1 + Math.sin(elapsed + light.phase)) / 2;
        ctx.beginPath();
        ctx.arc(light.x + Math.sin(elapsed * .4 + light.phase) * 12, light.y, light.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      if (confetti.length) {
        celebrationAge += dt;
        ctx.globalAlpha = Math.max(0, 1 - celebrationAge / 2);
        confetti.forEach(particle => {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.vy += 110 * dt;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          if (particle.heart) {
            const size = 5;
            ctx.moveTo(particle.x, particle.y + size);
            ctx.bezierCurveTo(particle.x - 12, particle.y - 2, particle.x - 5, particle.y - 11, particle.x, particle.y - 5);
            ctx.bezierCurveTo(particle.x + 5, particle.y - 11, particle.x + 12, particle.y - 2, particle.x, particle.y + size);
          } else {
            ctx.arc(particle.x, particle.y, 2 + particle.size, 0, Math.PI * 2);
          }
          ctx.fill();
        });
        if (celebrationAge >= 2) clearCelebration();
      }
      ctx.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    }

    function sync() {
      if (!motionEnabled() || document.hidden) {
        if (frame !== null) window.cancelAnimationFrame(frame);
        frame = null;
        previousTime = null;
        clearCelebration();
        ctx.clearRect(0, 0, width, height);
        return;
      }
      if (frame === null) frame = window.requestAnimationFrame(draw);
    }

    function celebrate() {
      if (!motionEnabled() || document.hidden) return;
      clearCelebration();
      confetti = Array.from({ length: 76 }, (_, index) => {
        const angle = index / 76 * Math.PI * 8;
        const speed = 65 + index % 9 * 15;
        return {
          x: width * (index % 2 ? .75 : .25),
          y: height * .35,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 70,
          color: index % 3 ? "#f5bb51" : "#ef75a5",
          size: index % 3,
          heart: index % 8 === 0,
        };
      });
      canvas.classList.add("is-celebrating");
      sync();
    }

    resize();
    return { sync, resize, celebrate, clearCelebration };
  }

  function celebrateFinale() {
    if (currentScene !== scenes.length - 1 || finalePlayed || !motionEnabled() || document.hidden) return;
    finalePlayed = true;
    atmosphere.celebrate();
  }

  function drawKeepsake(artwork, sceneIndex) {
    const canvas = $("keepsake-art");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = getComputedStyle(document.documentElement);
    const color = (token) => palette.getPropertyValue(token).trim();
    const petal = color("--petal");
    const paper = color("--paper");
    const gold = color("--gold");
    const rose = color("--rose");
    const ink = color("--ink");
    const line = color("--line");
    const white = color("--white");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    const wash = ctx.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, sceneIndex % 2 ? paper : petal);
    wash.addColorStop(1, sceneIndex % 2 ? petal : paper);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    function ellipse(x, y, rx, ry, fill, rotation = 0) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    }

    function stroke(points, strokeColor = rose, lineWidth = 3) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    function flower(x, y, size, petals = 8) {
      ctx.save();
      ctx.translate(x, y);
      for (let i = 0; i < petals; i += 1) {
        const angle = (i / petals) * Math.PI * 2;
        ellipse(Math.cos(angle) * size * .56, Math.sin(angle) * size * .56, size * .46, size * .24, rose, angle);
      }
      ellipse(0, 0, size * .3, size * .3, gold);
      ctx.restore();
    }

    function sparkle(x, y, size, fill = gold) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.quadraticCurveTo(x + size * .16, y - size * .16, x + size, y);
      ctx.quadraticCurveTo(x + size * .16, y + size * .16, x, y + size);
      ctx.quadraticCurveTo(x - size * .16, y + size * .16, x - size, y);
      ctx.quadraticCurveTo(x - size * .16, y - size * .16, x, y - size);
      ctx.fillStyle = fill;
      ctx.fill();
    }

    function heart(x, y, size, fill = rose) {
      ctx.beginPath();
      ctx.moveTo(x, y + size * .6);
      ctx.bezierCurveTo(x - size * 1.6, y - size * .35, x - size * .65, y - size * 1.3, x, y - size * .5);
      ctx.bezierCurveTo(x + size * .65, y - size * 1.3, x + size * 1.6, y - size * .35, x, y + size * .6);
      ctx.fillStyle = fill;
      ctx.fill();
    }

    ctx.globalAlpha = .55;
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(49, 42, width - 98, height - 84, [230, 230, 12, 12]);
    ctx.stroke();
    ctx.globalAlpha = 1;

    [[134, 139, 15], [491, 182, 20], [130, 390, 14], [485, 397, 12]].forEach(([x, y, size]) => sparkle(x, y, size));
    [[190, 100], [460, 310], [103, 255], [429, 107], [195, 442], [523, 281]].forEach(([x, y]) => ellipse(x, y, 2.5, 2.5, rose));

    ctx.save();
    ctx.translate(320, 275);
    if (artwork === "diya") {
      const glow = ctx.createRadialGradient(0, -45, 5, 0, -45, 140);
      glow.addColorStop(0, color("--glow"));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(-180, -200, 360, 400);
      ctx.beginPath();
      ctx.moveTo(0, -122);
      ctx.bezierCurveTo(-74, -45, -34, 9, 0, 9);
      ctx.bezierCurveTo(48, 9, 58, -47, 0, -122);
      ctx.fillStyle = gold;
      ctx.fill();
      ellipse(1, -19, 10, 22, paper);
      ctx.beginPath();
      ctx.moveTo(-105, 29);
      ctx.bezierCurveTo(-81, 143, 81, 143, 105, 29);
      ctx.closePath();
      ctx.fillStyle = rose;
      ctx.fill();
      ellipse(0, 28, 105, 24, gold);
      ellipse(0, 28, 89, 15, paper);
      stroke([[0, 25], [0, 12]], ink, 4);
      for (let i = -2; i <= 2; i += 1) ellipse(i * 25, 65 + (2 - Math.abs(i)) * 11, 4, 4, gold);
      flower(-116, 122, 26);
      flower(111, 119, 21);
    } else if (artwork === "flower") {
      flower(0, 0, 108, 9);
      ellipse(-18, -4, 4, 6, ink);
      ellipse(18, -4, 4, 6, ink);
      ctx.beginPath();
      ctx.arc(0, 6, 13, .12, Math.PI - .12);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.stroke();
      stroke([[0, 100], [0, 147]], rose, 4);
      ellipse(19, 122, 27, 10, gold, -.5);
      heart(100, -105, 17);
      heart(-99, 100, 12);
    } else if (artwork === "moon") {
      ellipse(0, 0, 103, 103, gold);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 104, 0, Math.PI * 2);
      ctx.clip();
      // Draw the original background over part of the moon, leaving a crescent.
      ctx.translate(-320, -275);
      ctx.fillStyle = wash;
      ctx.beginPath();
      ctx.arc(358, 241, 88, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      sparkle(84, -52, 24, rose);
      sparkle(110, 74, 15);
      sparkle(-43, -147, 12, rose);
      heart(29, 143, 17);
    } else if (artwork === "sparkle") {
      sparkle(0, 0, 112);
      sparkle(97, -90, 28, rose);
      sparkle(-84, 98, 24, rose);
      heart(-109, -72, 23);
      heart(100, 100, 19);
      ellipse(-11, -1, 3, 5, ink);
      ellipse(11, -1, 3, 5, ink);
      ctx.beginPath();
      ctx.arc(0, 9, 9, 0, Math.PI);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (artwork === "sweet") {
      ctx.fillStyle = rose;
      ctx.beginPath();
      ctx.roundRect(-111, -49, 222, 148, 13);
      ctx.fill();
      ctx.fillStyle = paper;
      ctx.beginPath();
      ctx.roundRect(-97, -36, 194, 111, 6);
      ctx.fill();
      [-59, 0, 59].forEach((x) => {
        ellipse(x, 16, 25, 25, gold);
        ellipse(x - 5, 9, 3, 3, paper);
        ellipse(x + 7, 17, 2, 2, paper);
        ellipse(x - 3, 25, 2, 2, paper);
      });
      ctx.save();
      ctx.translate(4, -105);
      ctx.rotate(-.1);
      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.roundRect(-118, -36, 236, 74, 9);
      ctx.fill();
      ctx.strokeStyle = rose;
      ctx.lineWidth = 2;
      ctx.stroke();
      heart(0, 1, 20);
      ctx.restore();
      stroke([[-29, 102], [0, 122], [29, 102]], gold, 5);
    } else if (artwork === "letter") {
      ctx.fillStyle = rose;
      ctx.beginPath();
      ctx.roundRect(-114, -67, 228, 153, 12);
      ctx.fill();
      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.moveTo(-110, -63);
      ctx.lineTo(0, 18);
      ctx.lineTo(110, -63);
      ctx.closePath();
      ctx.fill();
      stroke([[-106, 78], [-40, 19]], paper, 2);
      stroke([[106, 78], [40, 19]], paper, 2);
      ellipse(0, 14, 30, 30, paper);
      heart(0, 16, 19);
      heart(-78, -124, 15);
      heart(78, -129, 21);
      sparkle(1, -148, 13);
      flower(0, 139, 25);
    }
    ctx.restore();
    ctx.globalAlpha = .2;
    flower(64, 633, 27);
    flower(572, 625, 32);
    ctx.globalAlpha = 1;
    // A small border detail, not a placeholder portrait or a made-up person.
    ellipse(320, 477, 4, 4, white);
    placeholder.classList.add("has-art");
  }

  function showPhoto(scene) {
    if (scene.photo && photo.getAttribute("src") === scene.photo && photo.complete && photo.naturalWidth > 0) {
      photo.alt = scene.alt;
      photo.hidden = false;
      placeholder.hidden = true;
      return;
    }
    const version = ++photoVersion;
    photo.hidden = true;
    photo.onload = null;
    photo.onerror = null;
    photo.removeAttribute("src");
    photo.alt = scene.alt;
    placeholder.hidden = false;
    $("placeholder-note").textContent = "your photo belongs here";
    placeholder.setAttribute("aria-label", `${artworkNames[scene.artwork]}; a placeholder for ${scene.alt}.`);

    if (!scene.photo) return;

    photo.onload = () => {
      if (version !== photoVersion) return;
      photo.hidden = false;
      placeholder.hidden = true;
    };
    photo.onerror = () => {
      if (version !== photoVersion) return;
      photo.hidden = true;
      placeholder.hidden = false;
      $("placeholder-note").textContent = "a little illustration while the photo is away";
      placeholder.setAttribute("aria-label", `${scene.alt} could not load. ${artworkNames[scene.artwork]} is shown instead.`);
    };
    photo.src = scene.photo;
  }

  function preloadNextPhoto() {
    const upcoming = scenes[currentScene + 1];
    if (!upcoming?.photo || upcoming.photo === cachedPhotoPath) return;
    cachedPhotoPath = upcoming.photo;
    cachedPhoto = new Image();
    cachedPhoto.src = upcoming.photo;
  }

  function revealMessage(message, animate = true) {
    if (messageFrame !== null) window.cancelAnimationFrame?.(messageFrame);
    messageFrame = null;
    const target = $("scene-message");
    target.textContent = message;
    target.classList.remove("is-entering");
    if (animate && motionEnabled() && window.requestAnimationFrame) {
      messageFrame = window.requestAnimationFrame(() => {
        messageFrame = null;
        if (motionEnabled() && !document.hidden) target.classList.add("is-entering");
      });
    }
  }

  function renderScene(announce = true) {
    const scene = scenes[currentScene];
    const isLast = currentScene === scenes.length - 1;
    document.body.dataset.scene = String(currentScene);
    document.body.dataset.presentation = scene.presentation;
    $("keepsake-note").textContent = scene.stickerNote;
    $("note-symbol").textContent = scene.symbol;
    $("finale-keepsakes").hidden = !isLast;
    if (!isLast) {
      finalePlayed = false;
      atmosphere.clearCelebration();
    }
    document.body.dataset.started = "true";
    document.body.dataset.stage = "surprises";
    $("moment-label").textContent = scene.label;
    $("scene-heading").textContent = scene.heading;
    $("scene-heading").hidden = false;
    $("scene-message").hidden = false;
    revealMessage(scene.message, announce);
    $("personal-note").textContent = scene.note;
    $("photo-label").textContent = `${String(currentScene + 1).padStart(2, "0")} / ${scene.caption}`;
    $("placeholder-title").textContent = scene.placeholder;
    $("button-label").textContent = isLast ? "Phir se dekhein? 💛" : "Ek aur surprise";
    $("button-arrow").textContent = isLast ? "↺" : "↗";
    nextButton.hidden = false;
    $("tap-hint").textContent = isLast ? "final wish — click anywhere for a little more magic" : "click anywhere on the screen for the next photo";
    const count = $("scene-count");
    count.replaceChildren(document.createTextNode(`${String(currentScene + 1).padStart(2, "0")} `));
    const total = document.createElement("span");
    total.textContent = `/ ${String(scenes.length).padStart(2, "0")}`;
    count.append(total);

    progress.forEach((dot, index) => {
      dot.classList.toggle("is-current", index === currentScene);
      dot.classList.toggle("is-visited", index < currentScene);
      if (index === currentScene) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });

    try {
      drawKeepsake(scene.artwork, currentScene);
    } catch {
      // The CSS/emoji fallback keeps the site usable without Canvas support.
      placeholder.classList.remove("has-art");
    }
    showPhoto(scene);
    preloadNextPhoto();
    if (announce) $("scene-status").textContent = `Surprise ${currentScene + 1} of ${scenes.length}. ${scene.message}`;
  }

  function finishReveal(reveal = activeReveal) {
    if (!reveal || reveal !== activeReveal) return;
    activeReveal = null;
    window.clearTimeout(reveal.fadeTimer);
    window.clearTimeout(reveal.safetyTimer);
    reveal.animation?.cancel();
    if (currentScene !== reveal.index) {
      currentScene = reveal.index;
      renderScene();
    }
    card.classList.remove("is-spotlight");
    backdrop.classList.remove("is-visible");
    experience.classList.remove("is-transitioning");
    nextButton?.removeAttribute("aria-disabled");
    isTransitioning = false;
    celebrateFinale();
  }

  function revealCard(reveal) {
    if (activeReveal !== reveal) return;
    currentScene = reveal.index;
    renderScene();
    experience.classList.remove("is-transitioning");
    if (!motionEnabled() || typeof card.animate !== "function") {
      finishReveal(reveal);
      return;
    }

    try {
      // Measure the resting card center; rotation preserves that center.
      const rect = card.getBoundingClientRect();
      const viewport = window.visualViewport;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const centerX = (viewport?.offsetLeft || 0) + width / 2;
      const centerY = (viewport?.offsetTop || 0) + height / 2;
      const dx = centerX - (rect.left + rect.width / 2);
      const dy = centerY - (rect.top + rect.height / 2);
      // Reserve space for the tape, frame shadow, and mobile safe areas.
      const scale = Math.max(.1, Math.min((width - 64) / card.offsetWidth, (height - 96) / card.offsetHeight, 2));
      const spotlight = `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`;
      card.classList.add("is-spotlight");
      backdrop.classList.add("is-visible");
      reveal.animation = card.animate([
        { transform: `translate(${dx}px, ${dy}px) rotate(-8deg) scale(.2)`, opacity: 0, offset: 0, easing: "cubic-bezier(.2,.75,.2,1)" },
        { transform: spotlight, opacity: 1, offset: .333, easing: "ease-out" },
        { transform: spotlight, opacity: 1, offset: .611, easing: "cubic-bezier(.2,.75,.2,1)" },
        { transform: "translate(0, 0) rotate(-4deg) scale(1)", opacity: 1, offset: 1 },
      ], { duration: 900, fill: "both", easing: "linear" });
      reveal.animation.onfinish = () => finishReveal(reveal);
      reveal.animation.oncancel = () => finishReveal(reveal);
    } catch {
      finishReveal(reveal);
    }
  }

  function goToScene(index) {
    if (isTransitioning || index === currentScene || index < 0 || index >= scenes.length) return;
    isTransitioning = true;
    nextButton?.setAttribute("aria-disabled", "true");
    const reveal = { index, animation: null, fadeTimer: null, safetyTimer: null };
    activeReveal = reveal;
    const animate = motionEnabled() && typeof card.animate === "function";
    if (animate) experience.classList.add("is-transitioning");
    reveal.fadeTimer = window.setTimeout(() => revealCard(reveal), animate ? 120 : 0);
    // Animation events can disappear on cancellation or a suspended tab.
    reveal.safetyTimer = window.setTimeout(() => finishReveal(reveal), 1600);
  }

  function removeSticker(sticker) {
    window.clearTimeout(sticker.expiry);
    sticker.node.remove();
    activeStickers.delete(sticker);
  }

  function burstStickers(event, origin = nextButton) {
    if (!motionEnabled()) return;
    const rect = origin.getBoundingClientRect();
    const pointer = event.detail > 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
    const x = Math.max(24, Math.min(window.innerWidth - 24, pointer ? event.clientX : rect.left + rect.width / 2));
    const y = Math.max(24, Math.min(window.innerHeight - 24, pointer ? event.clientY : rect.top + rect.height / 2));
    const stickers = stickerSets[currentScene];
    stickers.forEach((text, index) => {
      while (activeStickers.size >= 24) removeSticker(activeStickers.values().next().value);
      const node = document.createElement("span");
      node.className = `tap-sticker${index === stickers.length - 1 ? " tap-sticker--word" : ""}`;
      node.textContent = text;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.setProperty("--dx", `${(index - 2) * 38}px`);
      node.style.setProperty("--dy", `${-65 - (2 - Math.abs(index - 2)) * 30}px`);
      node.style.setProperty("--tilt", `${(index - 2) * 14}deg`);
      stickerLayer.append(node);
      const sticker = { node, expiry: null };
      activeStickers.add(sticker);
      sticker.expiry = window.setTimeout(() => removeSticker(sticker), 950);
    });
  }

  function updateVideoPlayback() {
    const version = ++playbackVersion;
    if (!mediaConfig.backgroundVideo || videoFailed || !motionEnabled() || document.hidden) {
      video.pause();
      return;
    }
    try {
      const playback = video.play();
      playback?.then(() => {
        if (!motionEnabled() || document.hidden || videoFailed) video.pause();
        if (version === playbackVersion && motionEnabled() && !document.hidden && !videoFailed) videoBackground.hidden = false;
      }).catch(() => {
        if (version !== playbackVersion) return;
        videoBackground.hidden = true;
        video.pause();
      });
    } catch {
      videoBackground.hidden = true;
      video.pause();
    }
  }

  function updateMotion() {
    const enabled = motionEnabled();
    document.body.classList.toggle("motion-paused", !enabled);
    motionToggle.setAttribute("aria-pressed", String(!enabled));
    motionToggle.textContent = motionPreference.matches ? "Reduced motion is on" : enabled ? "Pause animations" : "Resume animations";
    motionToggle.disabled = motionPreference.matches;
    if (!enabled) {
      finishReveal();
      Array.from(activeStickers).forEach(removeSticker);
      if (messageFrame !== null) window.cancelAnimationFrame?.(messageFrame);
      messageFrame = null;
      $("scene-message").classList.remove("is-entering");
    }
    atmosphere.sync();
    updateVideoPlayback();
  }

  const advanceFromTap = (event) => {
    if (event.defaultPrevented || event.target.closest("a, button, input, textarea, select, [contenteditable], [role='button'], [data-no-advance]")) return;
    if (window.getSelection()?.toString()) return;
    burstStickers(event);
    if (currentScene < scenes.length - 1) goToScene(currentScene + 1);
  };

  nextButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.defaultPrevented) return;
    burstStickers(event);
    if (currentScene < scenes.length - 1) goToScene(currentScene + 1);
    else goToScene(0);
  });
  document.addEventListener("click", advanceFromTap);

  motionToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    userPausedMotion = !userPausedMotion;
    updateMotion();
  });
  motionPreference.addEventListener("change", updateMotion);
  window.addEventListener("resize", () => {
    atmosphere.resize();
    finishReveal();
  });
  window.addEventListener("scroll", () => finishReveal(), { passive: true });
  window.visualViewport?.addEventListener("resize", () => finishReveal());
  window.visualViewport?.addEventListener("scroll", () => finishReveal());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      finishReveal();
      Array.from(activeStickers).forEach(removeSticker);
      if (messageFrame !== null) window.cancelAnimationFrame?.(messageFrame);
      messageFrame = null;
    }
    atmosphere.sync();
    updateVideoPlayback();
  });
  video.addEventListener("error", () => {
    videoFailed = true;
    videoBackground.hidden = true;
    video.pause();
  });
  if (mediaConfig.backgroundVideo) {
    video.muted = true;
    video.src = mediaConfig.backgroundVideo;
  }

  renderScene(false);
  updateMotion();
  motionToggle.hidden = false;
  nextButton.disabled = false;
})();
