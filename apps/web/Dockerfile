# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS deps

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install deps (workspace)
RUN pnpm -w install --frozen-lockfile=false

# Build app
FROM node:20-bookworm-slim AS build
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN corepack enable
COPY --from=deps /app /app

# Copy sources
COPY apps /app/apps
COPY packages /app/packages

# Build-time API base (can be overridden via build-arg)
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

RUN pnpm -C apps/web build

# Runtime image
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN adduser --disabled-password --gecos '' nextjs && chown -R nextjs:nextjs /app
USER nextjs

COPY --from=build /app/apps/web/.next /app/apps/web/.next
COPY --from=build /app/apps/web/package.json /app/apps/web/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/node_modules /app/apps/web/node_modules

EXPOSE 3000
CMD ["pnpm", "-C", "apps/web", "start", "-p", "3000"]

