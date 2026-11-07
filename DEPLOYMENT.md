# Deploy Khushboo Ki Diwali

This is a static website: no build command, dependency installation, or backend is needed.

## Netlify drag-and-drop

1. Sign in to your own Netlify account at https://app.netlify.com/drop.
2. Drag the **deploy** folder from this project onto the upload area. Upload that folder, not the entire project. Its root must contain `index.html`.
3. Wait for Netlify to publish and display the HTTPS site address.
4. Open that address on a phone. Check the first photo and message, five advances, final wish, Replay, and motion controls before sharing.
5. To change the generated site name, use the site's settings in Netlify. A custom domain is optional.

The folder is `/home/gevin/Documents/Diwali_2026/deploy`.

A matching `khushboo-diwali.zip` is provided for transfer or a host that accepts ZIP uploads. If uploading a folder, extract the ZIP first and upload the folder containing `index.html`.

## Included files

- `index.html`, `styles.css`, and `script.js`
- Six used WebP photos in `assets/photos/`
- `assets/video/background.mp4`
- `robots.txt` and a Netlify-compatible `_headers` file

Original PNG uploads, the duplicate original video, tests, tools, and development documentation are excluded. The ten application/media files are copied without modification.

## Photo privacy

Publish only if you have permission to share the included photos and video. Hosting makes those files accessible to visitors, who can save them. An unlisted or hard-to-guess URL is not access control.

The bundle asks search engines not to index it, but those directives are not a privacy guarantee. If access must be restricted, configure real hosting-level authentication before sharing; do not rely on a JavaScript password prompt.

Nothing has been uploaded by preparing this package. Publication occurs when you upload it to the host.

## Preparing another release

Run `python3 tools/prepare-deploy.py` after reviewing and testing your changes. The script refuses to replace existing `deploy` or ZIP outputs. Keep the previous release or deliberately remove reviewed generated output before generating a replacement.
