# UI & Theme Domain Lessons

## System Theme Auto-Detection & FOUC Prevention
- When implementing system theme auto-detection with `window.matchMedia('(prefers-color-scheme: dark)')`, sync both `document.documentElement` attribute `data-theme` and class `dark` to support both CSS selectors and Tailwind's dark mode classes.
- Include a lightweight inline script in `index.html` head to apply the detected/stored theme prior to DOM rendering, preventing flash of unstyled content (FOUC).
