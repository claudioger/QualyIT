# ===========================================
# QualyIT Production Dockerfile
# Multi-stage build for Next.js 15 with pnpm
# Optimized for low-memory environments
# ===========================================

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ===========================================
# Dependencies stage
# ===========================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/

# Install dependencies (production only to reduce size)
RUN pnpm install --frozen-lockfile

# ===========================================
# Builder stage
# ===========================================
FROM base AS builder
WORKDIR /app

# Copy all from deps (including node_modules structure)
COPY --from=deps /app ./

# Copy source code
COPY . .

# Build arguments for environment variables needed at build time
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME=QualyIT

# Set environment for build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

# Build the application with memory optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build only the web app (packages are TypeScript sources)
RUN pnpm --filter @qualyit/web build

# ===========================================
# Production runner stage
# ===========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy packages needed at runtime
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/packages/shared ./packages/shared

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "apps/web/server.js"]
