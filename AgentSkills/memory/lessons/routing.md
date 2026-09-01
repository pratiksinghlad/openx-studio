# Routing Lessons

## 1. Native Path-Based Routing with Vite Base URL & SPA 404 Fallback
- **Context**: Avoid hash-based URLs (`#about`, `#/about`) in favor of standard, clean HTML5 History API path routing (`/about` or `/openx-studio/about`).
- **Rule**:
  - Encapsulate routing logic in `src/hooks/useRouter.ts` using `window.history.pushState`, `window.history.replaceState`, and `popstate` event listeners.
  - Normalize path parsing against `import.meta.env.BASE_URL` to support subpath hosting (e.g., GitHub Pages `/openx-studio/`) and root hosting (`/`) identically.
  - In `public/404.html`, provide standard SPA redirect query encoding so direct URL reloads on static hosts cleanly restore the proper path in `useRouter` without ever displaying a hash.
  - Decouple child components by using callback props (`onOpenAbout`) rather than hardcoding global navigation or hash mutations.
