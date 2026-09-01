# PWA & Web App Manifest Lessons

## 1. Relative `start_url` and `scope` on Subpath-Hosted Domains (GitHub Pages)
- **Problem**: When deploying a PWA to a subpath repository like `https://username.github.io/reponame/`, setting `"start_url": "/username/reponame/"` in `site.webmanifest` resolves against the root origin `https://username.github.io/`, resulting in an invalid path `https://username.github.io/username/reponame/` that falls back to the user's root domain (e.g. personal portfolio).
- **Rule**: Always use relative paths `"start_url": "./"` (or `"./?source=pwa"`), `"scope": "./"`, and `"id": "./"` in `site.webmanifest`. Under W3C manifest URL resolution rules, relative `./` resolves exactly to the deployed subpath (`https://username.github.io/reponame/`) and remains 100% portable to `localhost` and other preview environments.

## 2. Desktop Installability & High-Resolution Icon Assets
- **Rule**: Chromium browsers (Google Chrome, Microsoft Edge) require at least 192x192 and 512x512 PNG icons (standard and maskable) alongside SVG declarations to enable desktop and mobile installation badges and create OS shortcuts.
- **Rule**: Capture `beforeinstallprompt` via `window.addEventListener('beforeinstallprompt')`, call `e.preventDefault()`, store the deferred event, and trigger `.prompt()` via an accessible in-app button. Provide visual installation fallback instructions for browsers that do not fire `beforeinstallprompt` (Safari, Firefox).
