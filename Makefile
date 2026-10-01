.PHONY: install dev verify test e2e build docker up down tf-fmt tf-validate
install: ; npm ci
dev: ; npm run dev
verify: ; npm run verify
test: ; npm test
e2e: ; npx playwright install --with-deps chromium && npm run build && npm run test:e2e
build: ; npm run build
docker: ; docker build -f apps/api/Dockerfile -t ironwood-api . && docker build -f apps/web/Dockerfile -t ironwood-web .
up: ; docker compose up --build
down: ; docker compose down -v
tf-fmt: ; terraform -chdir=infra/terraform fmt -recursive
tf-validate: ; for d in dev prod; do terraform -chdir=infra/terraform/envs/$$d init -backend=false && terraform -chdir=infra/terraform/envs/$$d validate; done
