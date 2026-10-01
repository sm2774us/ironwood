# ADR 0006: Refactoring and modernization policy
**Status:** Accepted
Strangler approach: new code in TS strict (`noUncheckedIndexedAccess`); JS files migrated when touched; characterization tests before refactor; PRs ≤ ~400 lines with a follow-up checklist in the template; codemods for mechanical changes; ESLint flat config enforces consistency (a11y, hooks).
