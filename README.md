# OpenX Studio

> **In-Browser Scenario Player, Visual Editor, and Simulator for ASAM OpenSCENARIO & OpenDRIVE**  
> Powered by **esmini WebAssembly (WASM)**, **Three.js**, **React**, **TypeScript**, and **Web Workers**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-brightgreen.svg)](https://nodejs.org/)
[![Simulation Engine: esmini (MPL 2.0)](https://img.shields.io/badge/Simulation%20Engine-esmini%20(MPL%202.0)-blue.svg)](https://github.com/esmini/esmini)
[![ASAM Standards: OpenDRIVE & OpenSCENARIO](https://img.shields.io/badge/ASAM%20Standards-OpenDRIVE%20%7C%20OpenSCENARIO-orange.svg)](https://www.asam.net)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success.svg)](https://pratiksinghlad.github.io/openx-studio/)

---

## Description

**OpenX Studio** is a client-side, zero-install 3D scenario player, visual inspector, and simulation environment built for automotive engineers, ADAS researchers, and autonomous vehicle developers. 

It executes standard **ASAM OpenSCENARIO** (`.xosc`) dynamic scenarios over **ASAM OpenDRIVE** (`.xodr`) road networks directly inside the web browser. The core simulation physics engine runs via **esmini compiled to WebAssembly (WASM)** inside dedicated **Web Workers**, providing real-time 60+ FPS visualization, bidirectional timeline scrubbing, multi-camera 3D perspectives, entity telemetry, and schema validation without transmitting any scenario data to external servers.

### Key Features
- **Client-Side Simulation**: Full C++ esmini physics engine compiled into WebAssembly for high-fidelity execution.
- **Off-Main-Thread Architecture**: Simulation stepping and geometry parsing run in Web Workers for silky-smooth UI response.
- **Interactive 3D Viewport**: Rendered with Three.js featuring Orbit, Ego Follow, and Top-Down Bird's-Eye camera modes.
- **Timeline & Frame Scrubbing**: Real-time playback controls with frame-cached backward stepping, variable speed (0.25x–8.0x), and interactive timeline seeking.
- **Dual File Dropzone**: Drag-and-drop support for `.xosc` and `.xodr` with real-time XML schema validation.
- **Scenario Inspector & Telemetry**: Dynamic speed (km/h and m/s), coordinates, vehicle dimensions, road parameters, and storyboards.
- **Pre-compressed Assets**: Brotli (`.br`) and Gzip (`.gz`) pre-compression for ultra-fast asset delivery.

---

## How to Connect via Website Hosted or Run Locally

### Hosted Web Version
Access the hosted web application directly in any modern browser (Chrome, Edge, Firefox, Safari):

🌐 **Hosted Live Website**: [https://pratiksinghlad.github.io/openx-studio/](https://pratiksinghlad.github.io/openx-studio/)

- No plugins, installation, or backend servers required.
- Load sample scenarios with one click or upload your own `.xosc` / `.xodr` files.

### Running Locally
You can also clone the repository and run OpenX Studio locally on your workstation for offline development or testing:

```bash
git clone https://github.com/pratiksinghlad/openx-studio.git
cd openx-studio
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Local Setup and Running

### 1. Clone Repository
```bash
git clone https://github.com/pratiksinghlad/openx-studio.git
cd openx-studio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on `http://localhost:3001` with COOP/COEP headers |
| `npm run build` | Runs TypeScript type checking (`tsc`) and bundles production assets into `build/` |
| `npm run build:cf` | Builds production bundle with root base path (`/`) for Cloudflare Pages |
| `npm run preview` | Starts local preview server serving the production `build/` directory |
| `npm run deploy` | Runs predeploy (`npm run build`), postbuild (`node scripts/copy-404.js`), and publishes `build/` to GitHub Pages via `gh-pages` |

---

## Requirement and Package

### System Requirements
- **Node.js**: LTS version recommended
- **Package Manager**: npm, pnpm, or yarn
- **Web Browser**: Modern browser with WebGL and WebAssembly support (Chrome, Edge, Firefox, Safari)

### Core Packages & Dependencies

#### Application & UI Framework
- **React** & **React DOM**: Modern React interface with concurrent rendering.
- **Three.js**: 3D WebGL rendering engine for road geometry, vehicle meshes, and lighting.
- **Radix UI Primitives**: Accessible UI components (`@radix-ui/react-dialog`, `@radix-ui/react-slider`, `@radix-ui/react-tabs`, `@radix-ui/react-scroll-area`, `@radix-ui/react-tooltip`).
- **Lucide React**: Crisp SVG icons.
- **Tailwind CSS**, **Autoprefixer**, **PostCSS**: Utility-first styling with dark/light theme switching.

#### Build Tools & Utilities
- **Vite**: Blazing fast ESM bundler and development server configured with output to `build/`.
- **TypeScript**: Strict static typing and protocol interfaces.
- **vite-plugin-compression**: Automatic Gzip and Brotli asset pre-compression.
- **gh-pages**: Automated deployment pipeline to GitHub Pages.

---

## All Package and Policies and License of ASME, OpenX and esmini WASM

### Application License (OpenX Studio)
The OpenX Studio application source code, UI components, and web client are licensed under the **[MIT License](LICENSE)**:

```text
MIT License
Copyright (c) 2026 OpenX Studio Contributors
Permission is hereby granted, free of charge, to any person obtaining a copy...
```

### Simulation Engine License (esmini WASM)
- **Engine**: [esmini](https://github.com/esmini/esmini) (Environment Simulator Minimalistic)
- **Original Author**: Emil Knabe and open-source contributors.
- **License**: **[Mozilla Public License 2.0 (MPL-2.0)](https://www.mozilla.org/MPL/2.0/)**.
- **Distribution**: The WebAssembly binary distribution (`public/esmini.js`) is compiled from MPL-2.0 licensed source code. The terms of the MPL-2.0 apply to the esmini engine and its modifications.

### Standards & Trademark Notice (ASAM / OpenX / ASME)

- **ASAM Standards**:
  - **ASAM OpenSCENARIO®**: Defines the dynamic behavior and storyboards of autonomous vehicle scenarios.
  - **ASAM OpenDRIVE®**: Defines the static road network geometry, lane topological connectivity, and road markings.
  - **ASAM OpenX®**: Umbrella term for the ASAM open standard family (OpenDRIVE, OpenSCENARIO, OpenCRG, OpenODD).
- **Trademark Notice**:
  - **ASAM®**, **ASAM OpenDRIVE®**, **ASAM OpenSCENARIO®**, and **ASAM OpenX®** are registered trademarks of **[ASAM e.V.](https://www.asam.net)** (Association for Standardisation of Automation and Measuring Systems).
  - OpenX Studio is an **independent, community-driven open-source project** and is **not** officially affiliated with, sponsored by, approved by, or certified by ASAM e.V. or ASME.
  - Standard specifications, schema identifiers, and file extensions are referenced strictly for interoperability, technical accuracy, and file format compatibility under fair use.

### Privacy & Data Policy
- **100% Client-Side Processing**: All uploaded OpenSCENARIO (`.xosc`) and OpenDRIVE (`.xodr`) files are processed entirely in browser memory (virtual Emscripten filesystem) and never uploaded to any remote server.
- **Cross-Origin Isolation**: Uses standard Cross-Origin-Opener-Policy (COOP) and Cross-Origin-Embedder-Policy (COEP) headers for secure high-resolution timer and Web Worker isolation.

---

## Contributing

Contributions, feature requests, and bug reports are welcome! Please feel free to open an issue or submit a pull request on GitHub.
