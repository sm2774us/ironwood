# ADR 0007: CI policy
**Status:** Accepted
One required check, **`ci-ok (required check)`**, aggregates format, lint, types, tests, build, Playwright + axe, Lighthouse budgets, image builds and Terraform checks. A team can adopt the repository by understanding one gate.
**No dependency-update bot.** Automated update branches and pull requests add review load and notification noise for little value on a project this size; dependencies are upgraded deliberately in ordinary pull requests.
**Nothing flaky or unrelated can fail a pull request:** Trivy is report-only (a new base-image CVE must not block unrelated work), CodeQL is skipped where unsupported, Lighthouse results are not uploaded anywhere, and deployment is inert until AWS is configured.
**Trade-off:** vulnerability findings are visible but not enforced. Promote Trivy to a gate (`exit-code: 1`) when the team wants that policy.
