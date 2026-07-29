# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 - dependencies. Cached until the lockfile changes.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile


# ---------------------------------------------------------------------------
# Stage 2 - build.
#
# NEXT_PUBLIC_* values are inlined at build time, so the API and media hosts
# have to be present here rather than only at run time.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

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
