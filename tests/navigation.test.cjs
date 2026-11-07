"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const productionSource = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
// Isolate behavior tests from the current personal-media selection.
const source = productionSource
  .replace(/photo: "[^"]*"/g, 'photo: ""')
  .replace(/backgroundVideo: "[^"]*"/, 'backgroundVideo: ""');

class Element {
  constructor() {
    this.attributes = new Map();
    this.classes = new Set();
    this.classList = {
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name),
      toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name),
    };
    this.listeners = {};
    this.children = [];
    this.dataset = {};
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.offsetWidth = 340;
    this.offsetHeight = 430;
    this.playCalls = 0;
    this.pauseCalls = 0;
    this.hidden = false;
    this.disabled = true;
    this.textContent = "";
  }

  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "src") this.src = "";
  }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  append(child) { child.parent = this; this.children.push(child); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
  replaceChildren(...children) { this.children = children; }
  closest() { return null; }
  getContext() { return null; }
  getBoundingClientRect() { return { left: 240, top: 280, width: 340, height: 430 }; }
  play() { this.playCalls += 1; return Promise.resolve(); }
  pause() { this.pauseCalls += 1; }
}

function setup({ reducedMotion = false, appSource = source, animationFailure = false, playbackFailure = false, loadedOpeningPhoto = "" } = {}) {
  const ids = [
    "experience", "scene-photo", "photo-placeholder", "next-button", "progress-dots",
    "keepsake-art", "placeholder-note", "moment-label", "scene-heading", "scene-message",
    "personal-note", "photo-label", "placeholder-title", "button-label", "button-arrow",
    "tap-hint", "scene-count", "scene-status", "photo-card", "spotlight-backdrop",
    "sticker-layer", "motion-toggle", "background-video", "video-background",
    "festival-atmosphere", "keepsake-note", "note-symbol", "finale-keepsakes",
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  elements["progress-dots"].children = Array.from({ length: 6 }, () => new Element());
  if (loadedOpeningPhoto) {
    elements["scene-photo"].setAttribute("src", loadedOpeningPhoto);
    elements["scene-photo"].src = loadedOpeningPhoto;
    elements["scene-photo"].complete = true;
    elements["scene-photo"].naturalWidth = 536;
  }
  const documentListeners = {};
  const timers = [];
  const preloaded = [];
  const windowListeners = {};
  const animations = [];
  let selection = "";
  let now = 0;
  let timerId = 0;
  const preference = { matches: reducedMotion, addEventListener(name, listener) { this.listener = listener; } };
  elements["video-background"].hidden = true;
  if (playbackFailure) elements["background-video"].play = () => Promise.reject(new Error("Autoplay blocked"));
  elements["photo-card"].animate = (frames, options) => {
    if (animationFailure) throw new Error("Animation not supported");
    const animation = { frames, options, cancel() { this.cancelled = true; this.oncancel?.(); } };
    animations.push(animation);
    return animation;
  };
  const document = {
    body: new Element(),
    documentElement: new Element(),
    getElementById: (id) => elements[id],
    createTextNode: (textContent) => ({ textContent }),
    createElement: () => new Element(),
    addEventListener: (name, listener) => { documentListeners[name] = listener; },
  };
  const window = {
    innerWidth: 1280,
    innerHeight: 900,
    matchMedia: () => preference,
    getSelection: () => ({ toString: () => selection }),
    addEventListener: (name, listener) => { windowListeners[name] = listener; },
    setTimeout: (callback, duration) => {
      const id = ++timerId;
      timers.push({ id, callback, duration, at: now + duration });
      return id;
    },
    clearTimeout: (id) => {
      const index = timers.findIndex((timer) => timer.id === id);
      if (index !== -1) timers.splice(index, 1);
    },
  };
  class Image {
    set src(value) { preloaded.push(value); }
  }
  vm.runInNewContext(appSource, { document, window, Image });

  function tick(duration = Infinity) {
    const until = now + duration;
    let count = 0;
    timers.sort((a, b) => a.at - b.at);
    while (timers.length && timers[0].at <= until) {
      if (++count > 100) throw new Error("Timers did not settle");
      const timer = timers.shift();
      now = timer.at;
      timer.callback();
      timers.sort((a, b) => a.at - b.at);
    }
    if (duration !== Infinity) now = until;
  }
  const flush = () => tick();

  function clickButton() {
    let stopped = false;
    const event = { stopPropagation: () => { stopped = true; } };
    elements["next-button"].listeners.click(event);
    if (!stopped) documentListeners.click({ target: elements["next-button"] });
    return stopped;
  }

  function clickPage({ interactive = false, defaultPrevented = false } = {}) {
    documentListeners.click({
      defaultPrevented,
      target: { closest: () => interactive ? {} : null },
    });
  }

  return {
    elements, document, timers, preloaded, animations, flush, tick, clickButton, clickPage,
    resize: () => windowListeners.resize(),
    clickMotion: () => elements["motion-toggle"].listeners.click({ stopPropagation() {} }),
    changeMotion: (matches) => { preference.matches = matches; preference.listener(); },
    setSelection: (value) => { selection = value; },
    scene: () => Number(document.body.dataset.scene),
  };
}

test("the opening screen immediately shows the first photo message and navigation", () => {
  const app = setup();
  assert.equal(app.scene(), 0);
  assert.equal(app.document.body.dataset.stage, "surprises");
  assert.equal(app.document.body.dataset.started, "true");
  assert.match(app.elements["scene-heading"].textContent, /Some people just\nglow differently/);
  assert.match(app.elements["scene-message"].textContent, /tumhari smile/);
  assert.equal(app.elements["scene-message"].hidden, false);
  assert.equal(app.elements["next-button"].hidden, false);
  assert.equal(app.elements["next-button"].disabled, false);
  assert.equal(app.elements["button-label"].textContent, "Ek aur surprise");
  assert.equal(app.elements["photo-placeholder"].hidden, false);
  assert.equal(app.elements["scene-photo"].hidden, true);
  assert.equal(app.elements["scene-photo"].src, "");
  assert.equal(app.timers.length, 0);
  assert.equal(app.elements["progress-dots"].children[0].getAttribute("aria-current"), "step");
});

test("five advances reach the final wish; subsequent page taps leave it there", () => {
  const app = setup();
  for (let i = 1; i <= 5; i += 1) {
    app.clickPage();
    app.flush();
    assert.equal(app.scene(), i);
    assert.match(app.elements["scene-status"].textContent, new RegExp(`Surprise ${i + 1} of 6`));
  }
  assert.match(app.elements["scene-heading"].textContent, /Happy Diwali,\nKhushboo/);
  assert.match(app.elements["button-label"].textContent, /Phir se/);
  app.clickPage();
  app.flush();
  assert.equal(app.scene(), 5);
  assert.equal(app.elements["progress-dots"].children[5].getAttribute("aria-current"), "step");
});

test("rapid mixed button and page clicks cannot skip a scene or leave navigation locked", () => {
  const app = setup();
  app.clickButton();
  app.clickButton();
  app.clickPage();
  assert.equal(app.scene(), 0);
  assert.equal(app.elements["next-button"].getAttribute("aria-disabled"), "true");
  app.flush();
  assert.equal(app.scene(), 1);
  assert.equal(app.elements["next-button"].getAttribute("aria-disabled"), undefined);
  assert.equal(app.elements.experience.classes.has("is-transitioning"), false);
  app.clickButton();
  app.flush();
  assert.equal(app.scene(), 2);
});

test("Next stops bubbling and Replay resets exactly once", () => {
  const app = setup();
  for (let i = 0; i < 5; i += 1) {
    assert.equal(app.clickButton(), true);
    app.flush();
  }
  app.clickButton();
  app.clickPage();
  app.flush();
  assert.equal(app.scene(), 0);
  assert.equal(app.elements["button-label"].textContent, "Ek aur surprise");
  assert.equal(app.elements["progress-dots"].children[5].getAttribute("aria-current"), undefined);
  assert.equal(app.elements["progress-dots"].children.some((dot) => dot.classes.has("is-visited")), false);
});

test("interactive elements, cancelled clicks, and text selections do not advance the scene", () => {
  const app = setup();
  app.clickPage({ interactive: true });
  app.clickPage({ defaultPrevented: true });
  app.setSelection("selected message");
  app.clickPage();
  app.flush();
  assert.equal(app.scene(), 0);
  app.setSelection("");
  app.clickPage();
  app.flush();
  assert.equal(app.scene(), 1);
});

test("reduced motion skips the spotlight and still unlocks navigation", () => {
  const app = setup({ reducedMotion: true });
  app.clickButton();
  assert.equal(app.timers[0].duration, 0);
  app.flush();
  assert.equal(app.scene(), 1);
  assert.equal(app.elements["next-button"].getAttribute("aria-disabled"), undefined);
});

test("each moment has its own placeholder title, message, and caption", () => {
  const app = setup();
  const titles = new Set();
  const messages = new Set();
  const captions = new Set();
  for (let i = 0; i < 6; i += 1) {
    titles.add(app.elements["placeholder-title"].textContent);
    messages.add(app.elements["scene-message"].textContent);
    captions.add(app.elements["photo-label"].textContent);
    app.clickPage();
    app.flush();
  }
  assert.equal(titles.size, 6);
  assert.equal(messages.size, 6);
  assert.equal(captions.size, 6);
});

test("a missing photo displays a meaningful fallback and navigation remains usable", () => {
  const app = setup({ appSource: source.replace('photo: ""', 'photo: "assets/photos/missing.jpg"') });
  assert.equal(app.elements["scene-photo"].src, "assets/photos/missing.jpg");
  app.elements["scene-photo"].onerror();
  assert.equal(app.elements["scene-photo"].hidden, true);
  assert.equal(app.elements["photo-placeholder"].hidden, false);
  assert.match(app.elements["photo-placeholder"].getAttribute("aria-label"), /could not load/);
  app.clickButton();
  app.flush();
  assert.equal(app.scene(), 1);
});

test("a supplied photo replaces the illustration; obsolete load callbacks cannot replace later scenes", () => {
  const app = setup({ appSource: source.replace('photo: ""', 'photo: "assets/photos/01.jpg"') });
  const loaded = app.elements["scene-photo"].onload;
  loaded();
  assert.equal(app.elements["scene-photo"].hidden, false);
  assert.equal(app.elements["photo-placeholder"].hidden, true);
  app.clickButton();
  app.flush();
  loaded();
  assert.equal(app.elements["scene-photo"].hidden, true);
  assert.equal(app.elements["photo-placeholder"].hidden, false);
});

test("the next supplied photo is preloaded without uploading media or saving state", () => {
  let photosAdded = 0;
  const appSource = source.replace(/photo: ""/g, () => `photo: "assets/photos/0${++photosAdded}.jpg"`);
  const app = setup({ appSource });
  assert.deepEqual(app.preloaded, ["assets/photos/02.jpg"]);
  app.clickButton();
  app.flush();
  assert.deepEqual(app.preloaded, ["assets/photos/02.jpg", "assets/photos/03.jpg"]);
});

test("the incoming card stays locked through the full spotlight and unlocks on finish", () => {
  const app = setup();
  app.clickButton();
  app.tick(120);
  assert.equal(app.scene(), 1);
  assert.equal(app.elements["photo-card"].classes.has("is-spotlight"), true);
  assert.equal(app.elements["spotlight-backdrop"].classes.has("is-visible"), true);
  assert.match(app.animations[0].frames[0].transform, /scale\(\.2\)/);
  assert.match(app.animations[0].frames.at(-1).transform, /rotate\(-4deg\) scale\(1\)/);
  app.clickButton();
  app.tick(500);
  assert.equal(app.scene(), 1);
  assert.equal(app.elements["next-button"].getAttribute("aria-disabled"), "true");
  app.animations[0].onfinish();
  assert.equal(app.elements["next-button"].getAttribute("aria-disabled"), undefined);
  assert.equal(app.elements["photo-card"].classes.has("is-spotlight"), false);
  assert.equal(app.elements["spotlight-backdrop"].classes.has("is-visible"), false);
});

test("animation failure, cancellation, timeout and resize cannot strand navigation", () => {
  const broken = setup({ animationFailure: true });
  broken.clickButton();
  broken.tick(120);
  assert.equal(broken.scene(), 1);
  assert.equal(broken.elements["next-button"].getAttribute("aria-disabled"), undefined);

  const cancelled = setup();
  cancelled.clickButton();
  cancelled.tick(120);
  cancelled.animations[0].cancel();
  assert.equal(cancelled.elements["next-button"].getAttribute("aria-disabled"), undefined);

  const resized = setup();
  resized.clickButton();
  resized.resize();
  resized.flush();
  assert.equal(resized.scene(), 1);
  assert.equal(resized.animations.length, 0);
  assert.equal(resized.elements["next-button"].getAttribute("aria-disabled"), undefined);

  const timedOut = setup();
  timedOut.clickButton();
  timedOut.flush();
  assert.equal(timedOut.scene(), 1);
  assert.equal(timedOut.elements["next-button"].getAttribute("aria-disabled"), undefined);
});

test("rapid taps cap stickers at 24 and all stickers expire", () => {
  const app = setup();
  for (let i = 0; i < 20; i += 1) app.clickButton();
  assert.equal(app.elements["sticker-layer"].children.length, 24);
  assert.equal(app.scene(), 0);
  app.tick(950);
  assert.equal(app.elements["sticker-layer"].children.length, 0);
  app.flush();
  assert.equal(app.scene(), 1);
});

test("final-scene page taps produce stickers without replaying", () => {
  const app = setup();
  for (let i = 0; i < 5; i += 1) { app.clickButton(); app.flush(); }
  app.clickPage();
  assert.equal(app.scene(), 5);
  assert.equal(app.elements["sticker-layer"].children.length, 5);
  app.flush();
  assert.equal(app.scene(), 5);
});

test("pause and reduced-motion changes settle the current reveal and clear stickers", () => {
  const app = setup();
  app.clickButton();
  app.tick(120);
  app.clickMotion();
  assert.equal(app.scene(), 1);
  assert.equal(app.elements["photo-card"].classes.has("is-spotlight"), false);
  assert.equal(app.elements["sticker-layer"].children.length, 0);
  assert.equal(app.document.body.classes.has("motion-paused"), true);
  app.clickButton();
  app.flush();
  assert.equal(app.scene(), 2);
  assert.equal(app.animations.length, 1);
  app.clickMotion();
  app.clickButton();
  app.tick(120);
  app.changeMotion(true);
  assert.equal(app.scene(), 3);
  assert.equal(app.elements["next-button"].getAttribute("aria-disabled"), undefined);
  assert.equal(app.elements["motion-toggle"].disabled, true);
});

test("empty video configuration never assigns a source or starts playback", () => {
  const app = setup();
  assert.equal(app.elements["background-video"].src, undefined);
  assert.equal(app.elements["background-video"].playCalls, 0);
  assert.equal(app.elements["video-background"].hidden, true);
});

test("configured video is persistent, pauses with motion, and resumes safely", async () => {
  const app = setup({ appSource: source.replace('backgroundVideo: ""', 'backgroundVideo: "assets/video/bg.mp4"') });
  await Promise.resolve();
  assert.equal(app.elements["background-video"].src, "assets/video/bg.mp4");
  assert.equal(app.elements["background-video"].muted, true);
  assert.equal(app.elements["video-background"].hidden, false);
  const calls = app.elements["background-video"].playCalls;
  app.clickButton();
  app.flush();
  assert.equal(app.elements["background-video"].playCalls, calls);
  app.clickMotion();
  assert.ok(app.elements["background-video"].pauseCalls > 0);
  app.clickMotion();
  await Promise.resolve();
  assert.equal(app.elements["background-video"].playCalls, calls + 1);
  app.elements["background-video"].listeners.error();
  assert.equal(app.elements["video-background"].hidden, true);
});

test("the complete gift configures six different existing photos and one existing video", () => {
  const photos = Array.from(productionSource.matchAll(/photo: "([^"]+)"/g), (match) => match[1]);
  const video = productionSource.match(/backgroundVideo: "([^"]+)"/)[1];
  assert.equal(photos.length, 6);
  assert.equal(new Set(photos).size, 6);
  for (const media of [...photos, video]) {
    assert.equal(fs.existsSync(path.join(__dirname, "..", media)), true, media);
    assert.ok(fs.statSync(path.join(__dirname, "..", media)).size > 0);
  }
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  assert.ok(html.includes(`src="${photos[0]}"`));
});

test("an already loaded opening photo stays visible without restarting its request", () => {
  const app = setup({
    appSource: source.replace('photo: ""', 'photo: "assets/photos/01.jpg"'),
    loadedOpeningPhoto: "assets/photos/01.jpg",
  });
  assert.equal(app.elements["scene-photo"].src, "assets/photos/01.jpg");
  assert.equal(app.elements["scene-photo"].hidden, false);
  assert.equal(app.elements["photo-placeholder"].hidden, true);
  assert.equal(app.elements["scene-photo"].onload, undefined);
});

test("blocked video playback preserves the static background", async () => {
  const app = setup({ playbackFailure: true, appSource: source.replace('backgroundVideo: ""', 'backgroundVideo: "assets/video/bg.mp4"') });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(app.elements["video-background"].hidden, true);
  app.clickButton();
  app.flush();
  assert.equal(app.scene(), 1);
});
