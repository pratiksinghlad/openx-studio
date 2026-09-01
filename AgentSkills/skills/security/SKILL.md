---
name: security
description: Input validation, secret management, safe queries, and secure coding practices.
---

# Security Guidelines

## Secrets & Data Protection
- Never hardcode, commit, or log credentials, API keys, passwords, connection strings, tokens, or sensitive user PII.
- Treat environment variables and secure secret stores as the single source for sensitive configuration.

## Input Validation & Sanitization
- Validate and sanitize all untrusted input at system, controller, and network boundaries.
- Reject invalid data early before passing it to internal business logic or data layers.

## Safe Queries & Injection Defense
- Always use parameterized queries, ORM expressions, or safe query builders to prevent SQL, command, or script injection.
- Never concatenate raw user input into database queries, file paths, shell execution, or rendered HTML templates.
