"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const playwrightPath = process.env.PLAYWRIGHT_PATH
  || "/home/gevin/.npm/lib/node_modules/omniroute/node_modules/playwright";
const browserPath = process.env.BROWSER_PATH || "/opt/brave.com/brave/brave";
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8000";
const outputDir = process.env.OUTPUT_DIR || "/tmp/khushboo-festival-check";
const { chromium } = require(playwrightPath);

fs.mkdirSync(outputDir, { recursive: true });

const photoPath = (index) => `assets/photos/moment-${String(index + 1).padStart(2, "0")}.webp`;

async function waitForRest(page) {
  await page.waitForFunction(() => !document.querySelector("#next-button")?.hasAttribute("aria-disabled"));
}

async function waitForPhoto(page, index) {
  await page.waitForFunction((src) => {
    const image = document.querySelector("#scene-photo");
    return image?.getAttribute("src") === src
      && image.complete
      && image.naturalWidth > 0
      && !image.hidden;
  }, photoPath(index));
}

async function activateNext(page, index) {
  await page.locator("#next-button").evaluate((button) => button.click());
  await page.waitForFunction((scene) => document.body.dataset.scene === String(scene), index);
  await waitForRest(page);
  await waitForPhoto(page, index);
}

async function assertNoOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}

async function waitForDecorationsToSettle(page) {
  await page.waitForFunction(() => {
    const backdrop = document.querySelector("#spotlight-backdrop");
    return !document.querySelector(".tap-sticker")
      && (!backdrop || Number(getComputedStyle(backdrop).opacity) < 0.01);
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    const remoteRequests = [];
    const badResponses = [];
    let videoRequests = 0;

    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith(`${baseUrl}/`) && !url.startsWith("data:")) remoteRequests.push(url);
      if (url.includes("assets/video/background.mp4")) videoRequests += 1;
    });
    page.on("response", (response) => {
      if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await waitForPhoto(page, 0);
    await waitForRest(page);

    assert.equal(await page.locator("#greeting").isVisible(), true, "Diwali greeting must be visible");
    assert.equal(await page.locator("#scene-message").isVisible(), true, "first pickup line must be visible");
    assert.equal(await page.locator("#next-button").isVisible(), true, "Next must be visible");
    assert.equal(await page.locator("#next-button").isEnabled(), true, "Next must be enabled");
    assert.match(await page.locator("#greeting").innerText(), /Happy Diwali.*Khushboo/i);
    assert.match(await page.locator("#scene-message").innerText(), /tumhari smile/i);
    assert.equal(await page.locator("#photo-placeholder").isVisible(), false);

    await page.waitForFunction(() => {
      const video = document.querySelector("#background-video");
      return video && !video.paused && video.videoWidth > 0 && video.currentTime > 0.3;
    }, null, { timeout: 15000 });
    const video = await page.locator("#background-video").evaluate((element) => ({
      width: element.videoWidth,
      height: element.videoHeight,
      duration: element.duration,
      muted: element.muted,
      loop: element.loop,
      playsInline: element.playsInline,
      currentTime: element.currentTime,
      error: element.error?.message,
    }));
    assert.deepEqual(
      { width: video.width, height: video.height, muted: video.muted, loop: video.loop, playsInline: video.playsInline },
      { width: 720, height: 1280, muted: true, loop: true, playsInline: true },
    );
    assert.ok(video.duration > 8 && video.duration < 10, `unexpected duration ${video.duration}`);
    assert.equal(video.error, undefined);
    assert.equal(await page.locator("#video-background").isVisible(), true);
    await page.screenshot({ path: path.join(outputDir, "01-opening-desktop.png"), fullPage: true });

    const sceneStyles = new Set([await page.locator("body").getAttribute("data-presentation")]);
    for (let index = 1; index < 6; index += 1) {
      await activateNext(page, index);
      assert.equal(await page.locator("#photo-placeholder").isVisible(), false);
      assert.equal(await page.locator("#scene-photo").evaluate((image) => getComputedStyle(image).objectFit), "contain");
      sceneStyles.add(await page.locator("body").getAttribute("data-presentation"));
      await waitForDecorationsToSettle(page);
      await page.screenshot({
        path: path.join(outputDir, `${String(index + 1).padStart(2, "0")}-scene-desktop.png`),
        fullPage: true,
      });
    }
    assert.ok(sceneStyles.size >= 5, `expected varied presentations, got ${[...sceneStyles].join(", ")}`);
    assert.match(await page.locator("#scene-heading").innerText(), /Happy Diwali/i);
    assert.match(await page.locator("#button-label").innerText(), /Phir se/i);
    assert.match(await page.locator("#tap-hint").innerText(), /spark|magic|sticker/i);

    await page.evaluate(() => {
      for (let index = 0; index < 30; index += 1) document.body.click();
    });
    assert.equal(await page.locator("body").getAttribute("data-scene"), "5");
    assert.ok(await page.locator(".tap-sticker").count() <= 24);
    await waitForDecorationsToSettle(page);
    await page.screenshot({ path: path.join(outputDir, "07-finale-desktop.png"), fullPage: true });

    await activateNext(page, 0);
    assert.match(await page.locator("#button-label").innerText(), /surprise/i);

    const pausedVideoTime = await page.locator("#background-video").evaluate(async (element) => {
      element.pause();
      if (Math.abs(element.currentTime - 4) >= 0.05) {
        await new Promise((resolve) => {
          element.addEventListener("seeked", resolve, { once: true });
          element.currentTime = 4;
        });
      }
      return element.currentTime;
    });
    const videoRequestCount = videoRequests;
    await activateNext(page, 1);
    const videoTimeAfterNavigation = await page.locator("#background-video").evaluate((element) => element.currentTime);
    assert.ok(videoTimeAfterNavigation >= pausedVideoTime - .15, `video reset from ${pausedVideoTime} to ${videoTimeAfterNavigation}`);
    assert.equal(videoRequests, videoRequestCount, "scene navigation must not reload the video");

    await page.locator("#motion-toggle").click();
    assert.equal(await page.locator("#background-video").evaluate((element) => element.paused), true);
    await page.locator("#motion-toggle").click();
    await page.waitForFunction(() => !document.querySelector("#background-video").paused);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "networkidle" });
    await waitForPhoto(page, 0);
    assert.equal(await page.locator("#background-video").evaluate((element) => element.paused), true);
    assert.equal(await page.locator("#motion-toggle").isDisabled(), true);
    await activateNext(page, 1);
    assert.equal(await page.locator("#photo-card").evaluate((card) => card.getAnimations().length), 0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload({ waitUntil: "networkidle" });
    await waitForPhoto(page, 0);
    await page.waitForFunction(() => !document.querySelector("#background-video").paused);
    // Reload after changing emulated motion so responsive spotlight checks start from a clean scene.
    await page.reload({ waitUntil: "networkidle" });
    await waitForPhoto(page, 0);
    await waitForRest(page);

    const viewports = [
      { width: 1280, height: 900, name: "desktop" },
      { width: 390, height: 844, name: "phone" },
      { width: 320, height: 640, name: "narrow" },
      { width: 844, height: 390, name: "landscape" },
    ];
    for (const viewport of viewports) {
      console.log(`Checking ${viewport.name} viewport…`);
      await page.setViewportSize(viewport);
      await page.reload({ waitUntil: "networkidle" });
      await waitForPhoto(page, 0);
      await waitForRest(page);
      await page.evaluate(() => scrollTo(0, 0));
      await assertNoOverflow(page);
      const target = 1;
      await page.locator("#next-button").evaluate((button) => button.click());
      await page.waitForFunction(() => document.querySelector("#photo-card").classList.contains("is-spotlight"));
      await page.locator("#photo-card").evaluate((card) => {
        const animation = card.getAnimations()[0];
        animation.pause();
        animation.currentTime = 440;
      });
      await waitForPhoto(page, target);
      const box = await page.locator("#photo-card").boundingBox();
      assert.ok(box.x >= 20 && box.y >= 20, `${viewport.name}: ${JSON.stringify(box)}`);
      assert.ok(box.x + box.width <= viewport.width - 20, `${viewport.name}: ${JSON.stringify(box)}`);
      assert.ok(box.y + box.height <= viewport.height - 20, `${viewport.name}: ${JSON.stringify(box)}`);
      assert.ok(Math.abs(box.x + box.width / 2 - viewport.width / 2) < 2, `${viewport.name}: horizontal center`);
      assert.ok(Math.abs(box.y + box.height / 2 - viewport.height / 2) < 2, `${viewport.name}: vertical center`);
      await assertNoOverflow(page);
      await page.screenshot({ path: path.join(outputDir, `spotlight-${viewport.name}.png`) });
      await page.locator("#photo-card").evaluate((card) => card.getAnimations()[0]?.finish());
      await waitForRest(page);
      await waitForDecorationsToSettle(page);
      await assertNoOverflow(page);
      await page.screenshot({ path: path.join(outputDir, `resting-${viewport.name}.png`), fullPage: true });
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.reload({ waitUntil: "networkidle" });
    await waitForPhoto(page, 0);
    await waitForRest(page);
    await page.locator("#next-button").focus();
    await page.keyboard.press("Enter");
    await waitForRest(page);
    await waitForPhoto(page, 1);
    assert.equal(await page.evaluate(() => document.activeElement.id), "next-button");
    await page.keyboard.press("Space");
    await waitForRest(page);
    await waitForPhoto(page, 2);

    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage();
    await touchPage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await waitForPhoto(touchPage, 0);
    await touchPage.locator("#scene-photo").tap();
    await touchPage.waitForFunction(() => document.body.dataset.scene === "1");
    await waitForRest(touchPage);
    await touchContext.close();

    assert.deepEqual(errors, [], `page errors: ${errors.join(" | ")}`);
    assert.deepEqual(badResponses, [], `bad responses: ${badResponses.join(" | ")}`);
    assert.deepEqual(remoteRequests, [], `external requests: ${remoteRequests.join(" | ")}`);

    console.log(`PASS: six real scenes, real video playback, finale/replay, motion controls, touch/keyboard, spotlight geometry, and responsive layouts. Screenshots: ${outputDir}`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
