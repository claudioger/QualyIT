# Quickstart: MVP Core Platform

**Feature**: 001-mvp-core-platform
**Date**: 2025-12-03

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 8+
- Git

## External Services Setup

### 1. Neon PostgreSQL

1. Create account at [neon.tech](https://neon.tech)
2. Create new project "qualyit"
3. Copy connection string to `DATABASE_URL`

### 2. Clerk Authentication

1. Create account at [clerk.com](https://clerk.com)
2. Create new application "QualyIT"
3. Enable Organizations feature
4. Configure:
   - Sign-in methods: Email (magic link)
   - Sign-up: Invite only (for MVP)
5. Copy keys to `.env`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 3. Cloudflare R2

1. Create Cloudflare account
2. Enable R2 in dashboard
3. Create bucket "qualyit-uploads"
4. Create API token with R2 read/write permissions
5. Copy to `.env`:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

### 4. Upstash Redis

1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy to `.env`:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 5. Novu (Notifications)

1. Create account at [novu.co](https://novu.co)
2. Create application
3. Copy `NOVU_API_KEY` to `.env`
4. Configure FCM integration in Novu dashboard

### 6. Firebase Cloud Messaging

1. Create Firebase project
2. Enable Cloud Messaging
3. Download service account JSON
4. Configure in Novu dashboard

## Local Development Setup

### Clone and Install

```bash
git clone https://github.com/your-org/qualyit.git
cd qualyit
pnpm install
```

### Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# R2 Storage
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="qualyit-uploads"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Redis
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Notifications
NOVU_API_KEY="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Setup

```bash
# Generate Drizzle client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed development data
pnpm db:seed
```

### Start Development Server

```bash
pnpm dev
```

App runs at `http://localhost:3000`

## Development Workflow

### Code Structure

```
apps/web/          # Next.js app
packages/database/ # Drizzle schema
packages/api/      # Hono routes
packages/shared/   # Types & validators
```

### Common Commands

```bash
# Development
pnpm dev              # Start all packages in dev mode
pnpm build            # Build all packages
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript check

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed test data

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run Playwright E2E tests
```

### Adding a New API Route

1. Add Zod schema in `packages/shared/src/validators/`
2. Add Drizzle query in `packages/database/src/`
3. Add Hono route in `packages/api/src/routes/`
4. Export from `packages/api/src/index.ts`

### Adding a New Page

1. Create page in `apps/web/app/(dashboard)/`
2. Add TanStack Query hook in `apps/web/lib/api/`
3. Create components in `apps/web/components/`

## Testing Multitenancy Locally

### Option 1: Subdomain via hosts file

Add to `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 demo.localhost
127.0.0.1 termas.localhost
```

Access at `http://demo.localhost:3000`

### Option 2: Header override (development only)

The dev server accepts `X-Tenant-Subdomain` header for testing:

```bash
curl -H "X-Tenant-Subdomain: demo" http://localhost:3000/api/areas
```

## Testing Offline Mode

1. Open Chrome DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Complete a task - should queue locally
4. Uncheck "Offline" - should sync automatically

## Deployment

### Vercel (Frontend)

```bash
vercel
```

Configure:
- Framework: Next.js
- Root directory: `apps/web`
- Build command: `pnpm build`
- Environment variables: All from `.env.local`

### Wildcard Domain Setup

1. Add domain `qualyit.app` in Vercel
2. Add wildcard `*.qualyit.app`
3. Configure DNS:
   ```
   A     @          76.76.21.21
   CNAME *          cname.vercel-dns.com
   ```

## Verification Checklist

After setup, verify:

- [ ] Can create new tenant via sign-up
- [ ] Can create areas in organization
- [ ] Can invite user via email
- [ ] Invited user can accept and sign in
- [ ] Can create and complete task
- [ ] Push notification received on task assignment
- [ ] Offline task completion syncs when online
- [ ] Photo upload works
- [ ] Dashboard shows correct stats

## Troubleshooting

### "Tenant not found" error

- Check subdomain matches a tenant's `subdomain` field
- Verify Clerk organization ID is linked

### Push notifications not working

- Check FCM is configured in Novu
- Verify device is registered (`/notifications/register-device`)
- Check browser notification permissions

### Offline sync failing

- Check service worker is registered (DevTools → Application)
- Verify IndexedDB has pending items
- Check network requests in DevTools

### RLS errors

- Ensure `app.current_tenant_id` is set in each request
- Check Clerk JWT contains organization ID
- Verify RLS policies are enabled on all tables
