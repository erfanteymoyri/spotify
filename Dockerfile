# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 - dependencies. Cached until the lockfile changes.
#
# pnpm is pinned and materialised into the image here. `corepack enable` alone
# only installs shims: with no resolved version on disk, *every* later `pnpm`
# call asks registry.npmjs.org for the latest stable release first. That turns
# a flaky or filtered connection to npm into a hard failure — at build time
# (`pnpm install` exiting 1) and, worse, at container start, where the dev
# server cannot boot at all. COREPACK_HOME fixes the download location so the
# later stages can copy this one resolution instead of repeating it.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile


# ---------------------------------------------------------------------------
# Stage used by docker-compose.override.yml (`target: dev`).
# Source is bind-mounted at runtime; node_modules stays in an anonymous volume.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS dev

COPY --from=deps /opt/corepack /opt/corepack
ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

EXPOSE 3000

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]


# ---------------------------------------------------------------------------
# Stage 2 - build.
#
# NEXT_PUBLIC_* values are inlined at build time, so the API and media hosts
# have to be present here rather than only at run time.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

COPY --from=deps /opt/corepack /opt/corepack
ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ARG NEXT_PUBLIC_MEDIA_HOST=localhost:9000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_MEDIA_HOST=$NEXT_PUBLIC_MEDIA_HOST \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build


# ---------------------------------------------------------------------------
# Stage 3 - runtime. `output: "standalone"` means only the traced server files
# are copied, which keeps the image small and free of build tooling.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
    CMD wget -qO- http://127.0.0.1:3000 >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
