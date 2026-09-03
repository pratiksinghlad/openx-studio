# Simulation Domain Lessons

## OpenSCENARIO Duration Determination
- Static XML parsing of `<SimulationTimeCondition>` can be misleading because scenarios frequently terminate early due to CollisionConditions, reach position triggers, or custom stop criteria (or have acts with theoretical times that exceed the actual collision point).
- The authoritative and robust method for all OpenSCENARIO (.xosc) scenarios is to pre-simulate/probe the scenario upon loading via the WebAssembly esmini runtime (`is_quit()`), caching frames into `frameHistory` to report the true end time immediately and deliver 60+ FPS scrubbing and seeking in both directions.

## Playback Step Interval Configuration
- Define step forward and backward intervals in a centralized configuration constant (`DEFAULT_STEP_INTERVAL_SECONDS = 2.0`) to avoid magic numbers and ensure consistency across tooltips, aria labels, and worker messages.

## 3D Viewport Video Export & MIME Fallback
- For WebGL canvas video recording with `MediaRecorder`, negotiate supported container MIME candidates (e.g., `video/mp4;codecs=avc1`, `video/mp4`, fallback `video/webm;codecs=h264`) and track simulation lifecycle so that on scenario completion (`isCompleted`), the recorder automatically flushes chunks and triggers clean download.

## OpenSCENARIO Domain Ordering & Parameter Classification
- OpenSCENARIO test matrices frequently contain large parameter sets (100+ items). Adhere strictly to the PEGASUS 6-layer model & ASAM OpenODD standards by prioritizing **ODD (Operational Design Domain & Environment)** first, followed by **Behavior & Dynamics**, then **Entities**, and finally **System**.
- Infer semantic descriptions and physical engineering units ($\text{m/s}$, $\text{lx}$, $\text{m}$, $\text{s}$, $\mu$, $^\circ$, $\text{m/s}^2$) directly from naming patterns and type metadata.

## YouTube-Style Player Keyboard Shortcuts & Target Filtering
- Intercept player hotkeys globally only after scenario simulation is loaded (`isLoaded === true`), strictly skipping interactive target elements (`<input>`, `<textarea>`, `<select>`, `contenteditable`) and modifier combinations (`Ctrl`, `Meta`, `Alt`) to avoid interfering with form fields, dialogs, and OS/browser shortcuts.
- Prevent default for keys like `Space`, `ArrowLeft`, and `ArrowRight` so that playback controls do not trigger page scrolling.

## Procedural Feature Classification Word Boundaries
- In OpenDRIVE road feature classifiers, naive substring searches like `desc.includes('tree')` cause collisions with infrastructure terms such as `'street'` or `'street_lamp'`. Always enforce token/word boundary checks (e.g. `/(^|[^a-z])(tree|vegetation|plant|bush)([^a-z]|$)/i`) and prioritize civil fixtures (`pole`, `lamp`, `light`, `barrier`) before botanical classes.

## Node.js Native ESM Test Type-Stripping Imports
- Under Node's native ESM test runner (`node --test`), TypeScript type-only definitions (`export type ...`) do not exist at JavaScript runtime. Any file imported during Node test execution must import types strictly via `import type { ... }` rather than standard value imports to prevent runtime `ERR_MODULE_NOT_FOUND` / `SyntaxError: does not provide an export named '...'`.

## esmini SE_ObjectType Enum Mapping
- In esmini C++ / WASM runtime, `SE_ObjectType` has values: `0 = NONE`, `1 = VEHICLE`, `2 = PEDESTRIAN`, `3 = MISC`.
- Do not mistake `1` for pedestrian. Value `1` represents all dynamic vehicles (`<Vehicle>` tags, Ego, cars, trucks, buses). Pedestrians (`<Pedestrian>` tags) are strictly value `2`. Misc objects (`<MiscObject>`) are value `3`.
