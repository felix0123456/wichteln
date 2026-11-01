FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g prisma@5.22.0 tsx@4.19.2

# 1. Dependencies Stage
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund --legacy-peer-deps && npm cache clean --force

# 2. Builder Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./dev.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN prisma generate
RUN npm run build

# 3. Runner Stage
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOME="/home/nextjs"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs nextjs

# Ensure directories for SQLite volume, public, and home exist with permissions
RUN mkdir -p .next data public /home/nextjs
RUN chown -R nextjs:nodejs .next data public /home/nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/wichteln.db"

# Push DB schema directly to mounted volume on startup, then start Next.js server
CMD ["/bin/sh", "-c", "prisma db push --accept-data-loss --skip-generate && (tsx prisma/seed.ts || true) && node server.js"]
