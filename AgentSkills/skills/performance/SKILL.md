---
name: performance
description: React rendering optimization, bundle code-splitting, and resource management.
---

# React Performance

## Render Optimization
- Eliminate unnecessary re-renders by colocating state locally rather than lifting state to global contexts.
- Compute derived state during render rather than synchronizing state copies inside effects.
- Use `useTransition` and `useDeferredValue` for non-blocking responsive UI updates during heavy renders.
- Measure render performance with React DevTools Profiler before applying `React.memo`, `useMemo`, or `useCallback`.

## Bundle & Asset Efficiency
- Code-split route boundaries and heavy widget components using `React.lazy` and `Suspense`.
- Avoid heavy runtime utility libraries when modern ES2024+ native methods exist.
- Use `loading="lazy"` and explicit dimensions for images and media to prevent layout shift (CLS).
- Cancel pending network requests via `AbortController` when dependencies change or components unmount.