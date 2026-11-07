# Khushboo Ki Diwali

A local, six-moment Diwali 2026 keepsake for Khushboo. Built with HTML, CSS, and vanilla JavaScript; no installation or build step is needed.

## Preview

From this folder, run:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000** in your browser. Stop the preview with Ctrl+C.

The first photo, message, and **Ek aur surprise** button appear immediately. Tap the page or use the button to move through six distinct festive chapters. The final Diwali wish stays visible until **Phir se dekhein? 💛** is chosen.

## Festival-of-light design

The experience uses a twilight-plum, festival-pink, marigold-gold, and warm-paper palette. Each chapter has its own treatment: ribbon welcome, scalloped confession, lunar scrapbook, amber sunburst, mithai stationery, and an open-letter finale. Photos are larger but remain fully contained, so the website does not crop faces.

Each incoming keepsake starts small, expands into a viewport-fitted spotlight, briefly holds, then returns to its tilted photo card. A reveal lasts roughly one second, and extra taps never skip scenes.

Tap to release chapter-specific hearts, flowers, ribbons, stars, gold flecks, and word stickers. Active stickers are bounded and expire automatically. The finale adds one brief gold-and-pink celebration plus six miniature keepsakes; final-screen taps create decorations without replaying.

A lightweight local Canvas supplies sparse floating lights and the short finale. Choose **Pause animations** to stop the atmosphere, decorative motion, video, and photo zoom. Choose **Resume animations** to bring the effects back. The device’s reduced-motion preference takes priority; changing it mid-reveal safely returns the card to its resting state.

## Included background video

Your supplied **9-second portrait video** is connected as `assets/video/background.mp4`. The original upload is unchanged. The video plays muted and loops behind a rose-tinted veil. To replace it later:

1. Put one short video you have permission to use in `assets/video/` (prefer a browser-friendly MP4).
2. In `script.js`, update the configured video path if you use a different filename:

   ```js
   const mediaConfig = { backgroundVideo: "assets/video/background.mp4" };
   ```

3. Refresh. It plays muted, loops, and stays behind a rose-tinted veil so messages remain readable. Changing photo scenes does not restart it.

Playback depends on browser autoplay support. If playback is blocked or the file cannot load, the static background remains usable. **Pause animations** pauses the video too. Video does not play when reduced motion is enabled or the browser tab is hidden. No audio is played.

Use permitted local uploads only. Do not add Instagram login details, passwords, cookies, or remote media links to the code.

## Included photos

All six supplied photos are connected in filename order. The original PNG uploads are unchanged; the website uses separate WebP copies with the same dimensions and no cropping. Together, the copies are about 0.66 MB instead of 4.97 MB for faster loading.

| Moment | Website photo | Original upload |
| --- | --- | --- |
| 1 | `assets/photos/moment-01.webp` | `Pasted image.png` |
| 2 | `assets/photos/moment-02.webp` | `Pasted image (2).png` |
| 3 | `assets/photos/moment-03.webp` | `Pasted image (3).png` |
| 4 | `assets/photos/moment-04.webp` | `Pasted image (4).png` |
| 5 | `assets/photos/moment-05.webp` | `Pasted image (5).png` |
| 6 | `assets/photos/moment-06.webp` | `Screenshot from 2026-11-07 21-43-21.png` |

Images are contained inside the frame so the complete photo remains visible. The opening image loads directly from HTML, and the next image is preloaded while you read each message. Illustrated keepsakes remain available as fallbacks if a photo cannot load.

To replace or reorder photos later:

1. Add permitted JPEG, PNG, or WebP files to `assets/photos/`. Keep your originals and use separate web-ready copies; convert HEIC before adding it.
2. Update the six `photo` paths in the ordered `scenes` array in `script.js`. Match the filename extension exactly and update each `alt` description to describe the actual photo.
3. If changing the opening photo, also update the `scene-photo` path and alt text in `index.html`. Keep that image visible and the `photo-placeholder` initially hidden for early loading.
4. Refresh. An empty or broken photo path shows the illustrated fallback without stopping navigation.

The `message`, `heading`, `note`, and `caption` fields in `script.js` are editable. The initial content is also present in `index.html` for a meaningful first wish before JavaScript loads; update it if you change the opening message. The recipient’s name appears in both files.

## Accessibility and privacy

- A real Next/Replay button works throughout; page taps also advance through the photos.
- Reduced-motion preferences remove decorative animation and transitions.
- Scene changes have a screen-reader announcement.
- The design uses local system fonts and local artwork. No external font requests, tracking, photo uploads, browser storage, or backend services.
- The twilight festival theme intentionally uses warm paper cards against a dark plum background.
- This development server listens only on the local computer. It is not a public link.

Do not treat a publicly hosted static website as private: visitors could access its included photo files. Review photo-sharing expectations and image metadata before choosing to deploy.

## Tests

Run the dependency-free behavior checks with:

```bash
node --test tests/navigation.test.cjs
```

These use a small mocked browser environment to check scene state and interactions; they do **not** replace real browser layout/accessibility checks.

Manual browser checklist:

- Opening scene → five advances → final scene; background taps do not replay.
- Next and Replay each activate once, including rapid taps.
- Tab to the opening button and use Enter/Space; check visible focus.
- Try reduced motion and a missing-image path.
- Check 320px/390px widths, desktop, and short landscape: no sideways scrolling, legible text, intact photos.
