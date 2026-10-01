# ADR 0002: State management
**Status:** Accepted
Three kinds of state, three tools:
- **Server state** → TanStack Query (cache, dedupe, retry, suspense).
- **URL state** → TanStack Router typed search params (shareable, back-button safe).
- **Client UI state** → Zustand (theme, author mode, booking draft, resilience banner).
Redux Toolkit was considered; rejected because almost no state is client-owned, so its ceremony buys nothing. Zustand selectors prevent re-render storms. No server data is copied into stores.
