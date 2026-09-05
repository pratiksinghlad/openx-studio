# Agent & Developer Instructions

> Operating instructions and engineering guidelines for AI agents and human contributors.

## Operating Contract
Always follow `AgentSkills/OPERATING.md` before making changes. Review relevant agent personas in `AgentSkills/agents/` and skills in `AgentSkills/skills/`.

## Goal
Implement requested changes with production-quality code, preserving existing behavior and
minimizing the diff, following the project's own architecture, standards, and conventions.

## Core Principles
- **Code Principles**: Adhere strictly to `AgentSkills/skills/principles/SKILL.md`.
- **Standards**: Adhere strictly to `AgentSkills/skills/standards/SKILL.md`.
- **Security**: Adhere strictly to `AgentSkills/skills/security/SKILL.md`.
- **Think Before Coding**: Thoroughly understand requirements. If ambiguous, ask before guessing.
- **Surgical Changes**: Make the smallest change that satisfies the request; touch only what is explicitly required.
- **Simplicity First (KISS / YAGNI)**: Favor simple, clear, maintainable solutions over clever abstractions. Do not add unrequested features.
- **Zero-Error Builds**: Every change must compile cleanly and pass existing and newly added tests.

## Definition of Done
- Builds cleanly and all tests pass without errors or warnings.
- No debug code, dead code, unused imports, or temporary files left behind.
- Changes are minimal, focused, covered by tests, and easy to review.

## Agent & Contributor Memory
- Read `AgentSkills/memory/index.md` at the start of every task (create if missing); load only relevant domain lessons.
- When a mistake is corrected or a durable rule discovered, record an actionable lesson in `AgentSkills/memory/lessons/<domain>.md` (create if missing) and update `index.md`.