# Next.js Web Application Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy all package.json files
COPY apps/web/package.json ./apps/web/
COPY packages/domain/package.json ./packages/domain/
COPY packages/application/package.json ./packages/application/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=deps /app/packages/application/node_modules ./packages/application/node_modules

# Copy workspace files
COPY pnpm-workspace.yaml package.json turbo.json tsconfig.json ./

# Copy packages (domain layer)
COPY packages/ ./packages/

# Copy web app source
COPY apps/web/ ./apps/web/

# Build packages first
RUN pnpm --filter @repo/domain build
RUN pnpm --filter @repo/application build

# Build web app
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter @repo/web build

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

# Copy node_modules from builder for pnpm workspace dependencies
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_PATH "/app/node_modules/.pnpm/next@14.1.0_react-dom@18.3.1_react@18.3.1/node_modules:/app/node_modules"

CMD ["node", "server.js"]
