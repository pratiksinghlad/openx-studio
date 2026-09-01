---
name: standards
description: Core code quality, complexity limits, naming, and structural conventions.
---

# Code Standards

## Complexity & Structure
- **Function Size**: Maximum 50 lines per function.
- **Shallow Nesting**: Maximum 2 levels of nesting; prefer early returns to flatten control flow.
- **Clean Signatures**: Maximum 4 parameters per function; use an options object or record for complex signatures.

## Design & Clean Code
- **SOLID / DRY / KISS**: Single-responsibility components; eliminate duplicated logic; prefer clear, direct implementations over speculative abstractions (YAGNI).
- **Naming & Clarity**: Use descriptive, domain-meaningful names for classes, functions, and variables.
- **No Magic Literals**: Replace magic numbers and strings with named constants or enums.
- **Contracts & Schemas**: Design explicit, human- and machine-readable data contracts, schemas, and self-describing APIs.
- **Intentional Comments**: Comment only where non-obvious rationale is required, never restate what the code itself expresses.

## Concurrency & Safety
- **Async Safety**: Use idiomatic non-blocking `async`/`await`; ensure operations are free of race conditions and deadlocks.
- **Cancellation**: Implement cancellation tokens or abort controllers for async and I/O boundaries.

## Errors & Logging
- **Idiomatic Errors**: Handle errors consistently with repository patterns; provide actionable context (what failed, where, identifiers).
- **No Silent Failures**: Never swallow exceptions silently.
- **Structured Logging**: Use structured logging entries rather than raw string concatenation.
