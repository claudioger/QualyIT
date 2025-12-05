# Implementation Plan: MVP Core Platform

**Branch**: `001-mvp-core-platform` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mvp-core-platform/spec.md`

## Summary

QualyIT MVP Core Platform delivers the foundational SaaS infrastructure for quality management
in hospitality. This includes multi-tenant architecture with complete data isolation, organizational
hierarchy management, user authentication with role-based access, task management with zero-friction
mobile UX (3 taps max), offline-first PWA capability, push notifications, and real-time dashboards.

Technical approach: Monorepo with Next.js 15 frontend (PWA), Hono edge API, Neon PostgreSQL with
Row-Level Security for multitenancy, Clerk for authentication, and Vercel/Cloudflare deployment.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode, no `any`)
**Primary Dependencies**:
- Frontend: Next.js 15, React 19, Shadcn/UI, Tailwind CSS v4, TanStack Query v5, Zustand v5
- Backend: Hono, Drizzle ORM, Zod
- Infrastructure: Clerk, Neon PostgreSQL, Upstash Redis, Cloudflare R2

**Storage**: Neon PostgreSQL (serverless) with Row-Level Security for tenant isolation
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: PWA (iOS 14+, Android 10+), Web (Chrome, Safari, Firefox)
**Project Type**: Web application (monorepo with apps/web and packages/)

**Performance Goals**:
- First Contentful Paint < 1.5s on 3G
- Time to Interactive < 3s
- Task completion in < 5 seconds (3 taps)
- API responses < 200ms p95

**Constraints**:
- Offline-capable for 8+ hours
- 100 concurrent users per tenant
- Photo uploads < 10 seconds on mobile
- Spanish (es-AR) primary language

**Scale/Scope**:
- MVP: Single hotel vertical
- ~20 screens (mobile-first)
- 8 core entities
- ~30 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Zero Friction UX | ✅ PASS | Task completion via swipe gestures, 3-tap max, bottom nav, no mandatory text |
| II. Real Data Only | ✅ PASS | No mock data; all endpoints connect to real Neon PostgreSQL; seed data is realistic |
| III. Mobile-First Architecture | ✅ PASS | PWA with Workbox offline, bottom nav, swipe gestures, camera integration, FCM push |
| IV. SaaS Multitenancy Security | ✅ PASS | RLS on all tables with tenant_id, Clerk organizations, subdomain resolution |
| V. Invisible Standards Compliance | ✅ PASS | Human-readable task labels, internal standard mapping (post-MVP for full compliance) |

**Gate Result**: PASSED - All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-core-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
qualyit/
├── apps/
│   └── web/                        # Next.js 15 PWA
│       ├── app/
│       │   ├── (auth)/             # Auth pages (sign-in, sign-up, invite)
│       │   │   ├── sign-in/
│       │   │   ├── sign-up/
│       │   │   └── invite/
│       │   ├── (dashboard)/        # Authenticated app shell
│       │   │   ├── layout.tsx      # Bottom nav, offline indicator
│       │   │   ├── page.tsx        # Home: Today's tasks
│       │   │   ├── tasks/
│       │   │   │   ├── page.tsx    # Task list
│       │   │   │   └── [id]/       # Task detail/completion
│       │   │   ├── areas/
│       │   │   │   ├── page.tsx    # Area list/tree
│       │   │   │   └── [id]/       # Area dashboard
│       │   │   ├── team/
│       │   │   │   ├── page.tsx    # User list
│       │   │   │   └── invite/     # Invite flow
│       │   │   ├── dashboard/      # Manager overview
│       │   │   └── settings/       # User preferences
│       │   ├── api/                # API routes (Hono)
│       │   │   ├── [[...route]]/   # Catch-all for Hono
│       │   │   └── webhooks/       # Clerk webhooks
│       │   ├── layout.tsx          # Root layout
│       │   └── manifest.ts         # PWA manifest
│       ├── components/
│       │   ├── ui/                 # Shadcn components
│       │   ├── tasks/              # Task-related components
│       │   │   ├── task-card.tsx
│       │   │   ├── task-completion.tsx
│       │   │   ├── checklist-item.tsx
│       │   │   └── swipeable-item.tsx
│       │   ├── areas/              # Area components
│       │   ├── dashboard/          # Dashboard widgets
│       │   └── layout/             # Shell, nav, headers
│       ├── lib/
│       │   ├── api/                # API client (TanStack Query)
│       │   ├── auth/               # Clerk helpers
│       │   ├── offline/            # Service worker, sync
│       │   └── utils/
│       ├── hooks/                  # Custom React hooks
│       ├── stores/                 # Zustand stores
│       ├── public/
│       │   ├── sw.js               # Service worker
│       │   └── icons/              # PWA icons
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   ├── database/                   # Drizzle schema & migrations
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── tenants.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── areas.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/
│   │   │   ├── seed.ts
│   │   │   └── index.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── api/                        # Hono API routes
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── tenants.ts
│   │   │   │   ├── areas.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   └── notifications.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # Clerk verification
│   │   │   │   ├── tenant.ts       # Tenant resolution
│   │   │   │   └── rls.ts          # RLS context
│   │   │   ├── lib/
│   │   │   │   ├── db.ts           # Database client
│   │   │   │   └── storage.ts      # R2 client
│   │   │   └── index.ts            # Hono app export
│   │   └── package.json
│   │
│   ├── shared/                     # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── validators/         # Zod schemas
│   │   │   └── constants/
│   │   └── package.json
│   │
│   └── config/                     # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── tests/
│   ├── e2e/                        # Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── tasks.spec.ts
│   │   └── areas.spec.ts
│   └── integration/                # API integration tests
│
├── turbo.json                      # Turborepo config
├── package.json                    # Root package.json
├── pnpm-workspace.yaml
└── .env.example
```

**Structure Decision**: Monorepo with Turborepo. Selected because:
1. Shared database schema between API and any future services
2. Type-safe contracts between frontend and backend via shared package
3. Single deployment pipeline with preview environments
4. Matches constitution's tech stack (Next.js 15, Hono, Drizzle)

## Complexity Tracking

No constitution violations requiring justification.
