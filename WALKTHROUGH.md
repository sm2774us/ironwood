# Ironwood Walkthrough

Two ways to run it, and one to just watch it work. Pick your path.

| You have | Go to |
|---|---|
| Windows 11, Docker Desktop | **Part 1** then **Part 2** |
| Ubuntu or WSL2 | **Part 3** |
| Just want to see the resilience guarantees | **Part 2, step 6** |

---

## Part 1 · Windows 11 setup (Command Prompt)

1. Install tools (once):
   ```bat
   winget install --id Git.Git -e
   winget install --id OpenJS.NodeJS.LTS -e
   winget install --id Docker.DockerDesktop -e
   winget install --id GitHub.cli -e
   ```
   Restart, start Docker Desktop, wait for the whale to say "running". Check `node -v` prints v22 or newer (minimum v20.11).
2. Get the code:
   ```bat
   cd %USERPROFILE%\code
   git clone https://github.com/sm2774us/ironwood.git
   cd ironwood
   ```
   (No repository yet? See **Part 5**.)
3. Configure (never commit `.env`):
   ```bat
   copy .env.example .env
   npm ci
   ```
   The defaults in `.env.example` work for local development. `AUTHOR_TOKEN` (API) and `VITE_AUTHOR_TOKEN` (web) must match; in production the API refuses to start with the default token.

## Part 2 · Run it and use it

1. Start everything with hot reload:
   ```bat
   npm run dev
   ```
   Web: **http://localhost:5173**. API: http://localhost:3001 (`/healthz`, `/readyz`).
   Or run the production-shaped stack in containers: `docker compose up -d --build`, then open **http://localhost:8080**.
2. **Tour the guest experience.** Home (hero, offers) → **Stay** (pick dates and guests, toggle *Available only*, sort) → **Dining**.
3. **Book a suite.**
   1. On **Stay**, press **Reserve** on any available suite.
   2. Press **Confirm reservation** with the form empty: an error summary is announced and focus jumps to the first invalid field.
   3. Fill first name, last name, email and confirm. You get a confirmation ID. Submitting twice never double-books (idempotent key).
4. **Edit content as an author.** Open **http://localhost:5173/?author=1**. Dashed outlines mark editable fields. Click the headline, change it, **Save**. Reload: it persisted through `PATCH /api/content/:model/:id` using the author token. Inside a real Adobe Universal Editor frame the built-in editor steps aside and the `data-aue-*` attributes are used instead.
5. **See the headless contract.** Content arrives by persisted GET queries, never ad-hoc GraphQL:
   ```bat
   curl -i http://localhost:3001/graphql/execute.json/ironwood/home-hero
   ```
   Note the `ETag` and cache headers. Repeat with the `If-None-Match` header set to that ETag to get a `304`.
6. **See the resilience guarantees.** Stop and restart the API with failures injected:
   ```bat
   set CHAOS_RATE=0.5 && npm run dev -w @ironwood/api
   ```
   Reload the site repeatedly. Requests retry, the circuit breaker opens, and content falls back to the last known good copy (response header `x-content-stale`) while the page stays usable. A failing section shows its own "Try again" instead of breaking the page. Set `CHAOS_RATE=0` to recover.
7. **Operations console.** Open **/ops**: revenue chart, stats, and a server-side sorted, filtered, paginated reservations table (keyboard-sortable, `aria-sort`). It is a separate lazy chunk, fetched only when you navigate here.
8. **Engineering showcase.** Open **/showcase** for the live job-description to code traceability matrix (also in `docs/JD_TRACEABILITY.md`).
9. **Performance and vitals.** Web Vitals post to `/api/vitals`; summary at `/api/vitals/summary`. Bundle budget is enforced by `npm run build` (entry 90 kB, total 260 kB gzipped).
10. Stop: `Ctrl+C`, or `docker compose down` (add `-v` to erase data).

**Run all checks:** `npm run verify` (format, lint, typecheck, unit tests, build with bundle budget).
**End-to-end and accessibility tests:**
```bat
npx playwright install chromium
npm run build
npm run test:e2e
```

## Part 3 · Ubuntu or WSL2

Use the Linux filesystem in WSL (`~/code`, **not** `/mnt/c/...`) or file watching and installs are slow.

```bash
git clone https://github.com/sm2774us/ironwood.git ~/code/ironwood && cd ~/code/ironwood
nvm install && nvm use          # reads .nvmrc
cp .env.example .env
npm ci
npm run dev                     # web :5173, API :3001
```
Then follow Part 2 steps 2 to 9. Shortcuts: `make verify`, `make e2e`, `make up`, `make down`. Windows browsers reach WSL servers at `http://localhost:...` automatically.

## Part 4 · How CI works (so a red check is not a mystery)

| Job | What it proves |
|---|---|
| `verify` | Prettier, ESLint (a11y, hooks, zero warnings), typecheck, unit tests with coverage, production build and bundle budget |
| `e2e` | Playwright on desktop and mobile: axe WCAG 2.1 AA scans (4 pages, light and dark), booking flow, author-mode edit, resilience, skip link |
| `lighthouse` | Performance, accessibility, LCP and CLS budgets on `/`, `/stay`, `/dining` |
| `docker` (api, web) | Both images build; the API image starts hardened (read-only, no capabilities) and answers `/readyz`; Trivy prints a vulnerability report (report-only) |
| `terraform` | `fmt -check`, `validate` for dev and prod, tfsec |
| `ci-ok (required check)` | The only required status check: passes only if every job above passed |

**What is deliberately not here:** no dependency-update bot (it opens a stream of branches and pull requests; upgrade on purpose, in a normal pull request), no uploads to third-party services, and no scanner that can fail a pull request for a reason unrelated to its change.

`codeql.yml` runs only where GitHub supports it (public repositories, or private with Advanced Security); otherwise it is skipped, not failed. `deploy.yml` is skipped until the `AWS_DEPLOY_ROLE_ARN` variable exists (Part 6); after that, run it manually from the Actions tab and choose `dev` or `prod` (it never runs on push, so it adds no noise). It builds the API image, rolls ECS with circuit-breaker rollback, syncs the web build to S3 and invalidates CloudFront, authenticating through GitHub OIDC with no long-lived keys.

## Part 5 · Publish to GitHub and protect `main`

New repository:
```bash
git init -b main && git add -A && git commit -m "feat: Ironwood hospitality platform"
gh repo create sm2774us/ironwood --private --source . --push
```
Set the code owner (replaces the placeholder in `CODEOWNERS`):
```bash
sed -i 's/@your-github-handle/@sm2774us/g' CODEOWNERS
```
On Windows Command Prompt:
```bat
powershell -Command "(Get-Content CODEOWNERS) -replace '@your-github-handle','@sm2774us' | Set-Content CODEOWNERS"
```
Commit and push, then protect the default branch with the ruleset in `.github/rulesets/protect-main.json`:

1. GitHub repository → **Settings** → **Rules** → **Rulesets**.
2. **New ruleset** → **Import a ruleset** → choose `.github/rulesets/protect-main.json`.
3. Confirm **Enforcement status** is *Active* and save.

What it enforces on the default branch: no deletion, no force-push, changes only through a pull request with all review threads resolved (stale approvals dismissed on push), and the required check **ci-ok (required check)** green on an up-to-date branch. Let the CI workflow run once on a pull request before importing, so GitHub can resolve the check name.

## Part 6 · Deploy to AWS (optional)

```bash
cd infra/terraform/envs/dev
cp backend.hcl.example backend.hcl        # set your state bucket
terraform init -backend-config=backend.hcl
terraform apply -var github_repository=sm2774us/ironwood -var author_token=<long random string>
```
Copy the outputs into GitHub environment variables (`dev`, `prod`): `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `WEB_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`. The GitHub OIDC provider must already exist in the AWS account. Details in `infra/terraform/README.md`.

## Troubleshooting
| Symptom | Cause and fix |
|---|---|
| Author mode edit says unauthorized | `VITE_AUTHOR_TOKEN` (web) differs from `AUTHOR_TOKEN` (API). Make them equal and restart `npm run dev` |
| API exits at start in production | Default `AUTHOR_TOKEN` is rejected outside development. Set a real secret |
| Site shows stale content banner | Working as designed: the API is failing and last-known-good content is served. Check `CHAOS_RATE` and `/readyz` |
| Port 5173, 3001, 4173 or 8080 already used | Stop the other process, or change the port in `vite.config.ts` / `.env` / `docker-compose.yml` |
| `npm run build` fails on the bundle budget | A dependency grew the entry chunk. Lazy-load it or adjust the budget in `apps/web/scripts/check-bundle-size.mjs` deliberately |
| Playwright cannot launch a browser | Run `npx playwright install --with-deps chromium` |
| Ruleset import cannot find `ci-ok (required check)` | The workflow has not run yet. Open a pull request, let CI finish, then import or edit the ruleset |
| Slow installs or file watching in WSL | The repo is on `/mnt/c`. Clone inside WSL (`~/code`) |
| `.sh` script says bad interpreter after a Windows checkout | CRLF line endings. Re-clone inside WSL, or set `git config core.autocrlf input` |
