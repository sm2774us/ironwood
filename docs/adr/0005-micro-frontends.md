# ADR 0005: Micro-frontends
**Status:** Accepted (deferred adoption)
Feature folders (`features/content|booking|ops`) and lazy routes are structured as seams. The Ops console is the first candidate to extract (different audience, release cadence, heavy deps) via Module Federation or an independent deployable behind CloudFront path routing; shared tokens and `@ironwood/shared` already live in packages.
**Why not now:** one team, one release train; runtime federation adds version-skew risk without payoff.
