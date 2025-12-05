# Research: MVP Core Platform

**Feature**: 001-mvp-core-platform
**Date**: 2025-12-03

## Overview

This document captures research decisions for the QualyIT MVP. All technology choices align with
the constitution's defined stack. Research focuses on implementation patterns and best practices.

---

## 1. Multi-tenant Architecture with Row-Level Security

### Decision
Use PostgreSQL Row-Level Security (RLS) with Neon serverless, combined with Clerk organizations
for tenant context.

### Rationale

- **RLS at database level** ensures tenant isolation even if application code has bugs
- **Neon PostgreSQL** provides serverless scaling, database branching for preview environments
- **Clerk organizations** map 1:1 with tenants, providing built-in invite flows and RBAC

### Implementation Pattern

```sql
-- Every table includes tenant_id
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ...
);

-- RLS policy on every table
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY areas_tenant_isolation ON areas
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Set context in each request (middleware)
SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Separate databases per tenant | Operational complexity, cost at scale, no shared schema migrations |
| Schema-per-tenant | Migration complexity, connection pooling issues with Neon |
| Application-level filtering only | Security risk - RLS provides defense in depth |

---

## 2. Offline-First PWA Architecture

### Decision
Use Workbox with IndexedDB for offline storage, background sync for deferred operations.

### Rationale

- **Workbox** is the standard for PWA service workers, well-tested patterns
- **IndexedDB** handles complex queries needed for task filtering
- **Background Sync API** queues offline completions for reliable delivery

### Implementation Pattern

```typescript
// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Offline task completion stored in IndexedDB
const offlineStore = {
  async completeTask(taskId: string, data: TaskCompletion) {
    await db.pendingCompletions.add({ taskId, data, timestamp: Date.now() });
    // Register for background sync
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-completions');
  }
};

// Background sync handler in service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-completions') {
    event.waitUntil(syncPendingCompletions());
  }
});
```

### Offline Data Strategy

| Data Type | Offline Behavior |
|-----------|------------------|
| User's tasks | Cached on login, refreshed when online |
| Task completions | Queued in IndexedDB, synced via background sync |
| Photos | Stored as blobs in IndexedDB, uploaded when online |
| Areas/Team | Cached, read-only offline |
| Dashboard stats | Stale data with "last updated" indicator |

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| LocalStorage | 5MB limit, no complex queries, synchronous API |
| SQLite (WASM) | Overkill for MVP, larger bundle size |
| No offline support | Constitution requires offline-first, hospitality has connectivity gaps |

---

## 3. Swipe Gesture Implementation

### Decision
Use `@use-gesture/react` with Framer Motion for swipeable checklist items.

### Rationale

- **@use-gesture** provides low-level gesture detection with excellent mobile support
- **Framer Motion** handles smooth animations and spring physics
- Combined: Native-feel swipe interactions matching iOS/Android patterns

### Implementation Pattern

```tsx
import { useGesture } from '@use-gesture/react';
import { motion, useSpring } from 'framer-motion';

function SwipeableChecklistItem({ item, onComplete, onReject }) {
  const x = useSpring(0);

  const bind = useGesture({
    onDrag: ({ movement: [mx], last, velocity: [vx] }) => {
      if (last) {
        if (mx > 100 || vx > 0.5) {
          onComplete(item.id);
        } else if (mx < -100 || vx < -0.5) {
          onReject(item.id);
        }
        x.set(0);
      } else {
        x.set(mx);
      }
    }
  });

  return (
    <motion.div {...bind()} style={{ x }}>
      {/* Item content */}
    </motion.div>
  );
}
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| react-swipeable | Less control over animation physics |
| Native touch events | More boilerplate, harder to get right |
| Hammer.js | Older library, less React integration |

---

## 4. Push Notification Architecture

### Decision
Use Firebase Cloud Messaging (FCM) via Novu for orchestration, with Clerk webhooks for
user sync.

### Rationale

- **FCM** has best cross-platform support (iOS, Android, Web)
- **Novu** provides notification infrastructure (templates, preferences, digests)
- **Webhook-based** decouples notification logic from main app

### Implementation Pattern

```typescript
// Trigger notification via Novu
import { Novu } from '@novu/node';

const novu = new Novu(process.env.NOVU_API_KEY);

async function notifyTaskAssigned(userId: string, task: Task) {
  await novu.trigger('task-assigned', {
    to: { subscriberId: userId },
    payload: {
      taskTitle: task.title,
      dueDate: task.dueDate,
      areaName: task.area.name
    }
  });
}

// User preferences stored in Clerk metadata
// Novu handles preference-based filtering
```

### Notification Types (MVP)

| Type | Trigger | Recipients | Bypass Quiet Hours |
|------|---------|------------|-------------------|
| task-assigned | Task assignment | Assignee | No |
| task-reminder | 1 hour before due | Assignee | No |
| task-overdue | Past due date | Assignee + Supervisor | Yes |
| problem-reported | Problem submitted | Area supervisor | Yes |

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Direct FCM integration | More code, no preference management |
| OneSignal | Less developer-friendly, pricing concerns |
| Custom notification service | Build vs buy - Novu solves this well |

---

## 5. Real-time Dashboard Updates

### Decision
Use TanStack Query with polling (30s interval) for MVP; WebSocket upgrade path for V2.

### Rationale

- **Polling** is simpler, works offline, sufficient for 30s freshness requirement
- **TanStack Query** handles caching, background refetch, stale-while-revalidate
- **WebSocket** adds complexity (connection management, reconnection) - defer to V2

### Implementation Pattern

```typescript
// Dashboard query with auto-refetch
const { data: areaStats } = useQuery({
  queryKey: ['area-stats', areaId],
  queryFn: () => api.areas.getStats(areaId),
  refetchInterval: 30_000, // 30 seconds
  staleTime: 15_000,       // Consider stale after 15s
});

// Optimistic update on task completion
const completeMutation = useMutation({
  mutationFn: api.tasks.complete,
  onMutate: async (taskId) => {
    // Optimistically update UI
    queryClient.setQueryData(['tasks', 'today'], (old) =>
      old.map(t => t.id === taskId ? { ...t, status: 'completed' } : t)
    );
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries(['area-stats']);
  }
});
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| WebSockets (Supabase Realtime) | Added complexity for MVP; polling meets 30s requirement |
| Server-Sent Events | Less browser support, one-way only |
| No auto-refresh | Doesn't meet success criteria (30s freshness) |

---

## 6. Photo Upload and Storage

### Decision
Use Cloudflare R2 with presigned URLs, client-side compression before upload.

### Rationale

- **R2** has no egress fees (critical for photo-heavy app)
- **Presigned URLs** allow direct browser-to-R2 upload (bypass API size limits)
- **Client-side compression** reduces upload time on mobile networks

### Implementation Pattern

```typescript
// API generates presigned URL
app.post('/api/uploads/presign', async (c) => {
  const { filename, contentType } = await c.req.json();
  const key = `${tenantId}/tasks/${taskId}/${ulid()}-${filename}`;

  const presignedUrl = await r2.createPresignedUrl({
    bucket: 'qualyit-uploads',
    key,
    expiresIn: 3600,
    method: 'PUT'
  });

  return c.json({ uploadUrl: presignedUrl, key });
});

// Client-side compression + upload
async function uploadPhoto(file: File): Promise<string> {
  // Compress to max 1920px, 80% quality
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    quality: 0.8
  });

  const { uploadUrl, key } = await api.uploads.getPresignedUrl({
    filename: file.name,
    contentType: 'image/jpeg'
  });

  await fetch(uploadUrl, {
    method: 'PUT',
    body: compressed,
    headers: { 'Content-Type': 'image/jpeg' }
  });

  return key;
}
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| S3 | Egress fees add up with photo-heavy usage |
| Upload through API | Size limits, slower, more server load |
| No compression | Slow uploads on mobile, storage costs |

---

## 7. Subdomain-based Tenant Resolution

### Decision
Use Vercel's wildcard domains with middleware for tenant resolution.

### Rationale

- **Wildcard domains** (`*.qualyit.app`) provide clean tenant URLs
- **Middleware** extracts tenant from hostname before request handling
- **Clerk organizations** validate user belongs to resolved tenant

### Implementation Pattern

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // Skip for main domain
  if (subdomain === 'app' || subdomain === 'www') {
    return NextResponse.next();
  }

  // Resolve tenant by subdomain
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) {
    return NextResponse.redirect(new URL('/not-found', req.url));
  }

  // Add tenant to request headers for API routes
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  return response;
});
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Path-based (`/tenant/termas/...`) | Less professional, harder to manage |
| Query parameter | Not SEO-friendly, easily manipulated |
| Custom domains only | More setup friction for customers |

---

## Summary

All research items resolved. No NEEDS CLARIFICATION remaining. Implementation can proceed with:

1. **Multitenancy**: RLS + Clerk organizations
2. **Offline**: Workbox + IndexedDB + Background Sync
3. **Gestures**: @use-gesture + Framer Motion
4. **Notifications**: FCM via Novu
5. **Real-time**: TanStack Query polling (WebSocket in V2)
6. **Storage**: Cloudflare R2 with presigned URLs
7. **Tenant resolution**: Subdomain via Vercel middleware
