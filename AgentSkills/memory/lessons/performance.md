# Performance Lessons

## Code Splitting and Bundle Decoupling
- **Type/Constant Separation**: When code-splitting heavy libraries like Three.js, ensure constants and enum types (e.g. CameraMode, ViewTheme) are extracted into dedicated lightweight 	ypes.ts files. If components/hooks import constants from the main renderer file, Vite/Rollup will pull the entire renderer into the entry chunk.
- **Dynamic Imports & Suspense**: Lazy-load heavy components (ScenarioViewport, ScenarioInspector, PlayerControls) with React.lazy() and thin <Suspense fallback={...}> boundaries.
- **Pre-compression**: Use `vite-plugin-compression` with Brotli (`.br`) and Gzip (`.gz`) for ultra-low network transfer times.
- **Dynamic WASM Lazy-Loading**: Avoid eagerly downloading heavy WebAssembly binaries (e.g. `esmini.js`) on initial home page mount. Trigger runtime initialization dynamically when scenario execution starts (`loadScenario`) or pre-warm during `requestIdleCallback` after the main UI becomes fully interactive.
- **Targeted CSS Transitions**: Avoid `transition: all` or `transition-all` across interactive UI components. Explicitly specify the animated properties (e.g., `transition-colors`, `transition-transform`, or `transition-[height]`) to prevent browser layout thrashing and unnecessary render pipeline reflows.
