# Hono API Backend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy all package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/domain/package.json ./packages/domain/
COPY packages/application/package.json ./packages/application/
COPY packages/infrastructure/package.json ./packages/infrastructure/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Copy workspace files first
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.json ./

# Copy all package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/domain/package.json ./packages/domain/
COPY packages/application/package.json ./packages/application/
COPY packages/infrastructure/package.json ./packages/infrastructure/

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all dependencies (creates proper workspace symlinks)
RUN pnpm install --frozen-lockfile

# Debug: Check workspace symlinks
RUN echo "=== Checking node_modules/@repo/domain ===" && \
    ls -la node_modules/@repo/ && \
    echo "=== Checking if domain dist exists ===" && \
    ls -la packages/domain/dist/ || echo "Domain dist not found!" && \
    echo "=== Checking domain package.json ===" && \
    cat packages/domain/package.json | grep -A 3 '"main"'

# Build all packages using turbo (handles dependency order automatically)
RUN pnpm exec turbo build --filter @repo/api...

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copy built application
COPY --from=builder --chown=hono:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=hono:nodejs /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder --chown=hono:nodejs /app/packages/application/dist ./packages/application/dist
COPY --from=builder --chown=hono:nodejs /app/packages/infrastructure/dist ./packages/infrastructure/dist

# Copy node_modules (including workspace symlinks)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=builder /app/packages/application/node_modules ./packages/application/node_modules
COPY --from=builder /app/packages/infrastructure/node_modules ./packages/infrastructure/node_modules

# 🔥 FIX: Copy workspace packages to where node_modules symlinks expect them
COPY --from=builder --chown=hono:nodejs /app/packages ./packages

# Copy package.json files for runtime
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/domain/package.json ./packages/domain/
COPY --from=builder /app/packages/application/package.json ./packages/application/
COPY --from=builder /app/packages/infrastructure/package.json ./packages/infrastructure/

USER hono

# 🔥 FIX: Set working directory to apps/api for correct module resolution
WORKDIR /app/apps/api

EXPOSE 4000

ENV PORT 4000

CMD ["node", "dist/index.js"]
