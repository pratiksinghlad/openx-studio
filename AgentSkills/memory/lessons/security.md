# Security & CodeQL Lessons

## 1. Zero Unused Variables, Setters, and Imports
- **Problem**: CodeQL and static analyzers flag unused state variables, unused React state setters (setIsInstallSupported), and unreferenced imports (classifyParameter, Sparkles, Thermometer) as code-quality and potential dead-code/logic vulnerabilities.
- **Rule**: Never declare unused state setters or unreferenced imports. For environment-checking booleans, compute via pure helper functions (e.g. `checkIsInstallSupported()`) or omit unused setters. Enable `"noUnusedLocals": true` and `"noUnusedParameters": true` in `tsconfig.json` to catch issues during local compilation and CI builds.

## 2. Eliminate DOMParser for Untrusted XML/File Upload Validation (DOM XSS / js/xss-through-dom)
- **Problem**: CodeQL flags `DOMParser().parseFromString()` followed by DOM queries (like `querySelector('parsererror')` or `documentElement.tagName`) with alert `js/xss-through-dom` (DOM text reinterpreted as HTML) because parsing untrusted strings into browser DOM documents exposes client-side execution to DOM-based XSS, XML entity expansion (XXE), and DOM clobbering.
- **Rule**: Never use browser `DOMParser` to validate untrusted client-uploaded XML files or inspect root elements. Use a pure non-DOM string validator and tokenizer (`src/lib/xmlValidator.ts`) that sanitizes comments, CDATA, declarations, and DOCTYPE entities, and validates well-formedness and root elements in pure JavaScript.

