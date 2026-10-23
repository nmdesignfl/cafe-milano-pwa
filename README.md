# Cafe Milano Cleaning App — Install as a Phone App

This folder is a installable web app (PWA). Once it's hosted online, staff can
open the link on their phone and add it to the home screen — it then opens
like a regular app, works offline, and keeps its own icon.

## Files in this folder

- `index.html` — the app itself (checklists, history, all logic)
- `manifest.webmanifest` — tells the browser this is installable, sets the icon/name
- `service-worker.js` — caches the app so it works offline once installed
- `icons/` — app icon set (black square, red "M")
- `generate_icons.py` — regenerates the icons folder (run if you change the logo/colors)
- `serve.py` — runs a local preview server so you can test before deploying

## Preview it locally (optional, before hosting)

Requires Python 3 (no extra packages needed for `serve.py`):

```
python3 serve.py
```

This opens `http://localhost:8000/index.html` in your browser. Good for
checking the app works, but **"Add to Home Screen" testing on a phone won't
work against localhost** — for that you need it actually hosted (step 1 below).

## Regenerating icons (optional)

If you ever swap the logo or want different icon colors, edit the constants
at the top of `generate_icons.py` (`RED`, `BLACK`, `LETTER`), then run:

```
pip install Pillow
python3 generate_icons.py
```

This overwrites the five files in `icons/` to match.

## 1. Host the folder (pick one — all are free)

**Netlify (easiest, no account needed for a quick test):**
1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page
3. You'll get a live URL like `https://random-name.netlify.app`

**GitHub Pages:**
1. Create a new GitHub repo and upload all files in this folder
2. Repo Settings → Pages → set source to the main branch
3. Your URL will be `https://yourusername.github.io/reponame`

**Vercel:**
1. https://vercel.com → New Project → drag and drop this folder
2. Deploy — you'll get a `https://yourproject.vercel.app` URL

Keep the folder structure exactly as-is (`index.html`, `manifest.webmanifest`,
`service-worker.js`, and the `icons` folder all need to stay together at the
same level).

## 2. Install it on a phone

**iPhone (Safari only — Chrome on iOS won't show the install option):**
1. Open the hosted link in Safari
2. Tap the Share icon (square with an arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome):**
1. Open the hosted link in Chrome
2. Tap the three-dot menu
3. Tap "Install app" (or "Add to Home screen")
4. Confirm

The app icon (black square, red "M") will then appear on the home screen and
open full-screen, with no browser address bar.

## About the data

Each phone stores its own checklist history locally (in the browser's
on-device storage). This means:
- It works fully offline once installed
- Nothing is sent to a server — privacy stays on the device
- Different phones do **not** share or sync history with each other

If you'd ever want one combined log that all staff phones can see, that
requires a small backend/database — let me know and I can help set that up
separately.
