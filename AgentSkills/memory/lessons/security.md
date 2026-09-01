# Security & CodeQL Lessons

## 1. Zero Unused Variables, Setters, and Imports
- **Problem**: CodeQL and static analyzers flag unused state variables, unused React state setters (setIsInstallSupported), and unreferenced imports (classifyParameter, Sparkles, Thermometer) as code-quality and potential dead-code/logic vulnerabilities.
- **Rule**: Never declare unused state setters or unreferenced imports. For environment-checking booleans, compute via pure helper functions (e.g. `checkIsInstallSupported()`) or omit unused setters. Enable `"noUnusedLocals": true` and `"noUnusedParameters": true` in `tsconfig.json` to catch issues during local compilation and CI builds.
