---
name: frontend-design
description: Visible to user and agent. Distinctive, intentional visual design for new UI or reshaping existing ones.
---

# Frontend Design

Approach this as the design lead at a studio known for giving every client an unmistakable visual identity. Make deliberate, opinionated choices about palette, typography, and layout specific to the brief, and take one justified aesthetic risk.

## 1. Grounding & Calibration
- **Subject First**: Define the concrete subject, audience, and single job of the view before designing. Build with real domain vernacular and instruments.
- **Hero as Thesis**: Lead with the subject's most characteristic artifact (a live canvas, interactive tool, or data inspector) rather than generic marketing stats.
- **Avoid AI Defaults**: Do not default to (1) warm cream `#F4F1EA` + serif + terracotta, (2) near-black + neon acid-green, or (3) generic broadsheet newspaper columns unless explicitly requested.
- **Signature Element**: Create one memorable centerpiece. Keep everything around it disciplined and quiet.

## 2. Layout, Responsive Target & Fluid Sizing
- **Target Form-Factor**: Determine target responsiveness (desktop-first workstation, mobile-first, or fully responsive) by: (1) inspecting codebase layout patterns, (2) checking `AgentSkills/agents/`, or (3) asking the user if undefined.
- **Fluid Sizing (No Hardcoded `px`)**: Never use rigid `px` for layout widths, heights, or spacing. Use relative/fluid units (`%`, `rem`, `vw`, `vh`) and condition-based responsive prefixes (`sm:`, `md:`, `lg:`, `@container`).
- **Two Passes**: (1) Plan palette (4–6 named colors), type pairing (display + body), and ASCII layout. (2) Self-critique against generic templates before coding; derive styling directly from the plan.

## 3. UI Copy & Error Handling
- **Active Voice**: Interactive controls state exact outcomes ("Save changes," not "Submit"). Actions keep their name across flows ("Publish" $\rightarrow$ "Published").
- **3-Part Error Formula**: State (1) what failed, (2) why, and (3) actionable steps to fix or retry. Never use vague or robotic phrases ("An error occurred", "Oops!").
- **Empty States**: Treat empty screens as invitations to act with supportive copy and a primary CTA.

## 4. Agent Diagnostics ("When Something Goes Wrong")
- **Generic / Cluttered UI**: Remove unnecessary decoration (nested cards, fake counters, floating gradients) — apply Chanel's rule (remove one accessory).
- **Collisions & Clipping**: Avoid conflicting selectors (e.g., `.section` vs `.cta`). Use flex/grid gap over fragile margins, and ensure `min-w-0` on flex children.
- **Theme & Contrast**: Ensure WCAG AA compliance (4.5:1 body, 3:1 headers/icons) and keep `data-theme` attribute and `dark` class synchronized to prevent FOUC.
- **Critique Recovery**: Isolate specific user pain points, make surgical adjustments without breaking working state, and log lessons in `AgentSkills/memory/lessons/ui-theme.md`.

## 5. Post-Implementation Checklist (Top 4)
- [ ] **1. Fluid & Target Responsive**: Sized with `%` / relative units and condition-based prefixes matching target form-factor; zero horizontal overflow.
- [ ] **2. A11y & Focus**: Visible `:focus-visible` outlines present; `prefers-reduced-motion` and WCAG AA contrast respected.
- [ ] **3. Active Copy & Errors**: Controls use active voice; error and empty states provide clear, actionable direction.
- [ ] **4. Restraint & Signature**: One memorable signature centerpiece; no purposeless decoration or AI-default tropes.
