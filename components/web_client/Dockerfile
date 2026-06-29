# syntax=docker/dockerfile:1.7

# ----- Builder stage -----
FROM node:24-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable

# Workspace manifests for layer caching.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY components/service-task/package.json components/service-task/
COPY components/web_client/package.json components/web_client/

RUN pnpm install --frozen-lockfile

# Copy source.
COPY packages/shared-types ./packages/shared-types
COPY components/service-task ./components/service-task
COPY components/web_client ./components/web_client

# shared-types must build first (web_client imports its types via workspace:*).
RUN pnpm --filter @psykl/shared-types build

# Regenerate openapi.json + types.ts in case service-task changed.
RUN pnpm --filter @psykl/service-task build:openapi
RUN pnpm --filter @psykl/web-client codegen

# Build the Vite app.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @psykl/web-client build

# ----- Runtime stage -----
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY --from=builder /repo/components/web_client/dist/ ./
COPY components/web_client/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
