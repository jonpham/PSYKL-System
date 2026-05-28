# syntax=docker/dockerfile:1.7

# ----- Builder stage -----
FROM node:24-bookworm-slim AS builder
WORKDIR /repo

# Enable Corepack for the pnpm version pinned in package.json's packageManager field.
RUN corepack enable

# Copy workspace manifests first for better Docker layer caching.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY components/service-task/package.json components/service-task/

# Install ALL workspace deps (production + dev — build needs tsc + tsx).
RUN pnpm install --frozen-lockfile

# Copy the rest of the workspace.
COPY packages/shared-types ./packages/shared-types
COPY components/service-task ./components/service-task

# Build packages/shared-types first (service-task depends on its compiled output).
RUN pnpm --filter @psykl/shared-types build
RUN pnpm --filter @psykl/service-task build

# ----- Runtime stage -----
FROM node:24-bookworm-slim AS runtime
WORKDIR /app

# Enable Corepack so the pinned pnpm is available for `pnpm --filter ... start`.
RUN corepack enable

# Copy production node_modules + built dist from the builder.
COPY --from=builder /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=builder /repo/packages/shared-types/package.json /app/packages/shared-types/package.json
COPY --from=builder /repo/packages/shared-types/dist /app/packages/shared-types/dist
COPY --from=builder /repo/components/service-task/package.json /app/components/service-task/package.json
COPY --from=builder /repo/components/service-task/dist /app/components/service-task/dist
COPY --from=builder /repo/components/service-task/drizzle /app/components/service-task/drizzle

# Install production-only deps in the runtime image. Ignore lifecycle scripts so
# root `prepare` does not try to run Husky without dev dependencies installed.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production
ENV PORT=3000
ENV PGLITE_DATA_DIR=/var/lib/psykl/pglite
EXPOSE 3000

# Create the pglite data directory so the volume mount has a valid target.
RUN mkdir -p /var/lib/psykl/pglite

WORKDIR /app/components/service-task
CMD ["node", "dist/main.js"]
