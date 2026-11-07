"""Create a minimal static-hosting bundle without changing the source files."""

from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / "deploy"
ARCHIVE = ROOT / "khushboo-diwali.zip"
FILES = [
    "index.html",
    "styles.css",
    "script.js",
    *[f"assets/photos/moment-{number:02d}.webp" for number in range(1, 7)],
    "assets/video/background.mp4",
]

if DEPLOY.exists() or ARCHIVE.exists():
    raise SystemExit("Deployment output already exists. Review it before replacing it.")

for name in FILES:
    if not (ROOT / name).is_file():
        raise SystemExit(f"Required website file is missing: {name}")

DEPLOY.mkdir()
for name in FILES:
    target = DEPLOY / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / name, target)
    if target.read_bytes() != (ROOT / name).read_bytes():
        raise SystemExit(f"Copy verification failed: {name}")

# These discourage search indexing; they do not restrict visitor access.
(DEPLOY / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
(DEPLOY / "_headers").write_text(
    "/*\n"
    "  X-Robots-Tag: noindex, nofollow, noarchive\n"
    "  X-Content-Type-Options: nosniff\n"
    "  Referrer-Policy: no-referrer\n",
    encoding="utf-8",
)

with zipfile.ZipFile(ARCHIVE, "x", compression=zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(DEPLOY.rglob("*")):
        if file.is_file():
            archive.write(file, file.relative_to(DEPLOY).as_posix())

with zipfile.ZipFile(ARCHIVE) as archive:
    expected = set(FILES) | {"robots.txt", "_headers"}
    if set(archive.namelist()) != expected or archive.testzip() is not None:
        raise SystemExit("Archive validation failed.")

print(f"Deployment folder: {DEPLOY}")
print(f"ZIP archive: {ARCHIVE}")
print(f"Archive size: {ARCHIVE.stat().st_size / 1024 / 1024:.2f} MiB")
print("Verified: 10 required website files plus 2 hosting controls; no originals or tests.")
