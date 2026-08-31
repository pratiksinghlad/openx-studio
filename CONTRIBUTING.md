# Contributing to OpenX Studio

Thank you for your interest in contributing to **OpenX Studio**! We welcome contributions from developers, simulation engineers, autonomous driving researchers, and designers.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all interactions.

---

## How to Contribute

### 1. Reporting Issues & Requesting Features
- Before creating a new issue, check existing GitHub issues to avoid duplicates.
- Provide clear steps to reproduce bugs, including sample .xodr or .xosc files if relevant.
- Clearly describe feature proposals, use cases, and expected behaviors.

### 2. Submitting Pull Requests
1. Fork the repository on GitHub.
2. Clone your fork and create a topic branch:
   `ash
   git checkout -b feature/your-feature-name
   `
3. Install dependencies:
   `ash
   npm install
   `
4. Run the development server and test your changes:
   `ash
   npm run dev
   `
5. Ensure there are no TypeScript or build errors:
   `ash
   npm run build
   `
6. Commit your changes with clear, descriptive commit messages.
7. Push your branch and open a Pull Request against main.

---

## Architecture & Code Standards

- **React + TypeScript**: Use modern functional components with hooks, strict typing, and separation of concerns.
- **Off-Main-Thread Simulation**: The simulation engine executes inside a dedicated Web Worker (src/worker/). Do not block the UI thread with synchronous parsing or stepping loops.
- **Three.js Viewport**: Viewport rendering logic resides in src/renderer/ScenarioRenderer.ts. Keep 3D scene management efficient, clean, and disposed properly on unmount.
- **Styling**: Use Tailwind CSS and follow the existing design system tokens and dark/light theme structure.

---

## Licensing & Intellectual Property Policy

By contributing to OpenX Studio, you agree to the following licensing terms:

1. **Application Code (MIT)**:
   - All contributions to the frontend UI, visual editors, importers, exporters, and application code are licensed under the **MIT License**.
2. **Simulation Core & esmini (MPL-2.0)**:
   - Any modifications or contributions to the underlying esmini C++ bindings or WASM simulation runtime must comply with the **Mozilla Public License 2.0 (MPL-2.0)**.
3. **Trademarks & Nominative Use**:
   - **ASAM®, ASAM OpenDRIVE®, and ASAM OpenSCENARIO®** are registered trademarks of ASAM e.V.
   - Contributions must respect ASAM e.V. trademark policies. Do not claim official ASAM endorsement or certification without explicit authorization.
   - Give proper attribution to **esmini** (Emil Knabe & contributors) in simulation-related modules.
