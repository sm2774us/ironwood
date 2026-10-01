# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,target=/root/.npm npm ci --workspace @ironwood/web --workspace @ironwood/shared --include-workspace-root
COPY packages/shared packages/shared
COPY apps/web apps/web
# hadolint ignore=DL3064
ARG VITE_AUTHOR_TOKEN=
# hadolint ignore=DL3064
ENV VITE_AUTHOR_TOKEN=$VITE_AUTHOR_TOKEN
RUN npm run build -w @ironwood/web

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
ENV API_UPSTREAM=http://api:3001
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY apps/web/nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s CMD ["wget", "-qO-", "http://127.0.0.1:8080/nginx-health"]
