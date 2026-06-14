# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Bundle the stand-alone cron entrypoint (resolves @/* aliases, leaves npm
# packages external — they come from the runner's node_modules at runtime).
RUN npx esbuild scripts/run-cron.ts \
    --bundle --platform=node --format=cjs --packages=external \
    --tsconfig=tsconfig.json --outfile=scripts/run-cron.cjs

FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Full node_modules for prisma migrate deploy at startup
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma schema, config, and generated client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.js ./prisma.config.js

# Bundled cron entrypoint, run by the Coolify Scheduled Task (`node scripts/run-cron.cjs`)
COPY --from=builder --chown=nextjs:nodejs /app/scripts/run-cron.cjs ./scripts/run-cron.cjs

COPY startup.sh ./startup.sh
RUN chmod +x startup.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "startup.sh"]
