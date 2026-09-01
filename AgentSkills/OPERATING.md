# Operating Contract

## Workflow
1. **Memory & Context**: Read `AgentSkills/memory/index.md` (create if missing); load only relevant domain lessons to avoid repeating past mistakes.
2. **Role & Skill Discovery**: Load relevant role guidance from `AgentSkills/agents/` and skills from `AgentSkills/skills/`.
   - **Condition (UI / Frontend Changes)**: If the task involves UI components, visual styling, layout, user interaction, or frontend design, **MUST** load and apply `AgentSkills/skills/frontend-design/SKILL.md`.
3. **Pre-flight Inspection**: Inspect current codebase patterns, dependencies, and baseline build/test state.
4. **Surgical Implementation**: Apply the minimal change required; adhere strictly to DRY, KISS, and YAGNI.
5. **Verification**: Run the project's build and test commands (e.g. `npm test`, `dotnet test`, or project test suite) to verify happy paths and edge cases.
6. **Learning Loop**: If a mistake was made and corrected or a durable rule discovered, record a concise lesson in `AgentSkills/memory/lessons/<domain>.md` and update `index.md`.

## UI & Design Changes — Conditional Trigger

**Trigger Condition**: Invoked whenever the agent modifies, creates, or refactors frontend UI components, layouts, typography, styling (CSS/Tailwind), interactive controls, or user-facing UI copy.

Before and during any UI change, execute the following protocol:
1. **Load Design Skill**: Read `AgentSkills/skills/frontend-design/SKILL.md`.
2. **Review Memory**: Check `AgentSkills/memory/index.md` and relevant domain lessons (e.g. `lessons/ui-theme.md`).
3. **Responsive Target & Fluid Sizing**: Determine form-factor (desktop-first, mobile-first, or fully responsive) from the codebase, `AgentSkills/agents/`, or by asking the user if undefined. Never use rigid hardcoded `px`; use `%`, relative units, or condition-based responsive prefixes (`sm:`, `md:`, `lg:`).
4. **Copy & Error Text**: Enforce active-voice labels ("Save changes", not "Submit") and 3-part actionable error copy.
5. **Post-Implementation Checklist (Top 4)**: Validate the change against the Top 4 checklist in `frontend-design/SKILL.md` (Fluid & Target Responsive, A11y & Focus, Active Copy & Errors, Restraint & Signature).
6. **Agent Self-Correction**: If visual defects or collisions emerge, apply the troubleshooting steps in `frontend-design/SKILL.md`.

Only proceed after satisfying all protocol checks.

## Completion Checklist
- [ ] Project builds cleanly with zero errors or warnings.
- [ ] Automated tests pass and cover failure paths and edge cases.
- [ ] No dead code, debug logging, unused imports, or temporary files remain.
- [ ] Relevant documentation or memory lessons updated if applicable.

