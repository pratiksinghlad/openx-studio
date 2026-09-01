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
