---
name: principles
description: Core software engineering principles, simplicity ladder, surgical changes, and standards.
---

# Core Principles

Foundational software engineering principles and decision rules for AI agents and human contributors.

## The Simplicity Ladder
Before writing any code, stop at the first rung that holds:

1. **Does this need to be built at all?** (YAGNI)
2. **Does it already exist in this codebase?** Reuse the helper, util, or pattern that is already here; do not rewrite it.
3. **Does the standard library already do this?** Use it.
4. **Does a native platform feature cover it?** Use it.
5. **Does an already-installed dependency solve it?** Use it.
6. **Can this be one line and simple?** Make it one.
7. **Only then:** write the minimum code that works.

The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end-to-end, then climb.

## Root Cause Over Symptom
Bug fix = root cause, not symptom. A bug report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves sibling callers still broken.

## Foundational Principles
- **Think Before Coding**: Thoroughly understand requirements. If ambiguous, ask before guessing.
- **Surgical Changes**: Make the smallest change that satisfies the request; touch only what is explicitly required.
- **Simplicity First (KISS / YAGNI)**: Favor simple, clear, maintainable solutions over clever abstractions. Do not add unrequested features.
- **Zero-Error Builds**: Every change must compile cleanly and pass existing and newly added tests.
- **Standards & Security**: Adhere strictly to `AgentSkills/skills/standards/SKILL.md` and `AgentSkills/skills/security/SKILL.md`.