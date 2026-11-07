#!/usr/bin/env bash
# Prepare a separate website-only history; leave the existing repository intact.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/github-upload"

if [[ -e "$TARGET" ]]; then
  printf '%s\n' 'github-upload already exists. Review it before changing it.' >&2
  exit 1
fi

FILES=(index.html styles.css script.js robots.txt)
for NUMBER in 01 02 03 04 05 06; do
  FILES+=("assets/photos/moment-$NUMBER.webp")
done
FILES+=(assets/video/background.mp4)

for FILE in "${FILES[@]}"; do
  if [[ ! -f "$ROOT/deploy/$FILE" ]]; then
    printf 'Missing deployment file: %s\n' "$FILE" >&2
    exit 1
  fi
done
for FILE in index.html styles.css script.js "${FILES[@]:4}"; do
  if ! cmp -s "$ROOT/$FILE" "$ROOT/deploy/$FILE"; then
    printf 'Deployment copy differs from source: %s. Refresh the release first.\n' "$FILE" >&2
    exit 1
  fi
done

mkdir -- "$TARGET"
for FILE in "${FILES[@]}"; do
  mkdir -p -- "$(dirname -- "$TARGET/$FILE")"
  cp -- "$ROOT/deploy/$FILE" "$TARGET/$FILE"
  cmp -- "$ROOT/deploy/$FILE" "$TARGET/$FILE"
done
: > "$TARGET/.nojekyll"

git -C "$TARGET" init -b github-pages-site
git -C "$TARGET" config user.name 'abhishuleshgevin'
git -C "$TARGET" config user.email 'abhishuleshgevin@gmail.com'
git -C "$TARGET" remote add origin 'https://github.com/abhishuleshgevin/Diwali_2026.git'
git -C "$TARGET" add -- "${FILES[@]}" .nojekyll
git -C "$TARGET" diff --cached --stat
git -C "$TARGET" commit -m 'Publish minimal Diwali gift website' \
  -m 'Co-Authored-By: Claude <noreply@anthropic.com>'

printf '\nPrepared: %s\n' "$TARGET"
printf '%s\n' 'Nothing uploaded. To push from your terminal:'
printf 'git -C "%s" push -u origin github-pages-site\n' "$TARGET"
printf '%s\n' 'Then select github-pages-site and / (root) in GitHub Settings > Pages.'
