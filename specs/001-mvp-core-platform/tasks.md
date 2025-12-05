# Tareas: Plataforma MVP Core

**Entrada**: Documentos de diseño de `/specs/001-mvp-core-platform/`
**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: No solicitados explícitamente en la especificación. Omitidos (pueden agregarse después).

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y pruebas independientes.

## Formato: `[ID] [P?] [Historia?] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos diferentes, sin dependencias)
- **[Historia]**: A qué historia de usuario pertenece (HU1-HU6)
- Rutas de archivo exactas incluidas para todas las tareas

## Convenciones de Rutas (Monorepo)

Basado en la estructura de plan.md:

- **Frontend**: `apps/web/`
- **API**: `packages/api/src/`
- **Base de datos**: `packages/database/src/`
- **Compartido**: `packages/shared/src/`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicialización del monorepo y configuración de herramientas

- [x] T001 Crear raíz del monorepo con pnpm-workspace.yaml y turbo.json
- [x] T002 [P] Inicializar proyecto Next.js 15 con TypeScript en apps/web
- [x] T003 [P] Inicializar packages/database con Drizzle ORM
- [x] T004 [P] Inicializar packages/api con framework Hono
- [x] T005 [P] Inicializar packages/shared para tipos y validadores
- [x] T006 [P] Inicializar packages/config con configs compartidos de ESLint, TypeScript, Tailwind
- [x] T007 Configurar scripts en package.json raíz (dev, build, lint, typecheck)
- [x] T008 [P] Crear .env.example con todas las variables de entorno requeridas
- [x] T009 [P] Configurar Tailwind CSS v4 en apps/web/tailwind.config.ts
- [x] T010 [P] Instalar y configurar componentes base de Shadcn/UI en apps/web/components/ui/

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Infraestructura core que DEBE completarse antes de CUALQUIER historia de usuario

**⚠️ CRÍTICO**: No puede comenzar trabajo de historias de usuario hasta que esta fase esté completa

### Base de Datos

- [x] T011 Crear config de Drizzle en packages/database/drizzle.config.ts
- [x] T012 [P] Definir tipos enum en packages/database/src/schema/enums.ts
- [x] T013 [P] Crear schema de Tenant en packages/database/src/schema/tenants.ts
- [x] T014 Crear schema de Usuario en packages/database/src/schema/users.ts (depende de Tenant)
- [x] T015 Crear schema de Área en packages/database/src/schema/areas.ts (depende de Usuario, Tenant)
- [x] T016 Crear schema de unión AreaUsuario en packages/database/src/schema/area-users.ts
- [x] T017 Crear schema de Tarea en packages/database/src/schema/tasks.ts
- [x] T018 Crear schema de ItemChecklist en packages/database/src/schema/checklist-items.ts
- [x] T019 Crear schema de CompletacionTarea en packages/database/src/schema/task-completions.ts
- [x] T020 Crear schema de Problema en packages/database/src/schema/problems.ts
- [x] T021 Crear schema de ArchivoSubido en packages/database/src/schema/uploaded-files.ts
- [x] T022 Crear schema de Notificación en packages/database/src/schema/notifications.ts
- [x] T023 Crear export de índice de schemas en packages/database/src/schema/index.ts
- [x] T024 Generar migración inicial con drizzle-kit generate
- [x] T025 Crear archivo SQL de políticas RLS en packages/database/src/migrations/rls-policies.sql
- [x] T026 Crear cliente de base de datos en packages/database/src/index.ts

### Paquete Compartido

- [x] T027 [P] Definir tipos TypeScript en packages/shared/src/types/index.ts
- [x] T028 [P] Crear validadores Zod para todas las entidades en packages/shared/src/validators/
- [x] T029 [P] Definir constantes (roles, tipos de tarea, prioridades) en packages/shared/src/constants/

### Base de API

- [x] T030 Crear entrada de app Hono en packages/api/src/index.ts
- [x] T031 Crear wrapper de cliente de base de datos en packages/api/src/lib/db.ts
- [x] T032 [P] Crear cliente de almacenamiento R2 en packages/api/src/lib/storage.ts
- [x] T033 Crear middleware de auth Clerk en packages/api/src/middleware/auth.ts
- [x] T034 Crear middleware de resolución de tenant en packages/api/src/middleware/tenant.ts
- [x] T035 Crear middleware de contexto RLS en packages/api/src/middleware/rls.ts
- [x] T036 Crear middleware de manejo de errores en packages/api/src/middleware/error.ts

### Base de Frontend

- [x] T037 Configurar provider de Clerk en apps/web/app/layout.tsx
- [x] T038 Crear cliente de API con TanStack Query en apps/web/lib/api/client.ts
- [x] T039 [P] Crear store Zustand para estado offline en apps/web/stores/offline.ts
- [x] T040 [P] Crear registro de service worker en apps/web/lib/offline/sw-register.ts
- [x] T041 Crear manifest PWA en apps/web/app/manifest.ts
- [x] T042 Crear layout raíz con providers en apps/web/app/layout.tsx
- [x] T043 Crear layout de dashboard autenticado en apps/web/app/(dashboard)/layout.tsx
- [x] T044 [P] Crear componente de navegación inferior en apps/web/components/layout/bottom-nav.tsx
- [x] T045 [P] Crear componente indicador offline en apps/web/components/layout/offline-indicator.tsx

### Configuración de Rutas API

- [x] T046 Crear ruta catch-all de Hono en apps/web/app/api/[[...route]]/route.ts
- [x] T047 Crear manejador de webhook de Clerk en apps/web/app/api/webhooks/clerk/route.ts

**Checkpoint**: Base lista - la implementación de historias de usuario puede comenzar

---

## Fase 3: Historia de Usuario 1 - Alta de Tenant (Prioridad: P1) 🎯 MVP

**Objetivo**: Admin registra organización, crea áreas, da de alta usuarios desde panel admin

**Prueba Independiente**: Registrar hotel, crear 3 áreas con jerarquía, dar de alta 2 usuarios con roles

### Implementación de API para HU1

- [x] T048 [HU1] Crear rutas de tenant en packages/api/src/routes/tenants.ts
- [x] T049 [HU1] Crear rutas de área (CRUD, jerarquía) en packages/api/src/routes/areas.ts
- [x] T050 [HU1] Crear rutas de usuario (listar, crear, actualizar, cambiar contraseña) en packages/api/src/routes/users.ts
- [x] T051 [HU1] Implementar lógica de hash de contraseña y validación en packages/api/src/lib/auth.ts

### Implementación de Frontend para HU1

- [x] T052 [P] [HU1] Crear página de registro con creación de org en apps/web/app/(auth)/sign-up/page.tsx
- [x] T053 [P] [HU1] Crear página de inicio de sesión en apps/web/app/(auth)/sign-in/page.tsx
- [x] T054 [HU1] Crear página de cambio de contraseña obligatorio en apps/web/app/(auth)/change-password/page.tsx
- [x] T055 [HU1] Crear página de lista/árbol de áreas en apps/web/app/(dashboard)/areas/page.tsx
- [x] T056 [HU1] Crear componente de formulario de área en apps/web/components/areas/area-form.tsx
- [x] T057 [HU1] Crear componente de árbol de áreas en apps/web/components/areas/area-tree.tsx
- [x] T058 [HU1] Crear página de equipo con lista de usuarios en apps/web/app/(dashboard)/team/page.tsx
- [x] T059 [HU1] Crear formulario de alta de usuario (admin) en apps/web/app/(dashboard)/team/new/page.tsx
- [x] T060 [HU1] Crear hooks de TanStack Query para áreas en apps/web/lib/api/areas.ts
- [x] T061 [HU1] Crear hooks de TanStack Query para usuarios en apps/web/lib/api/users.ts

### Datos Semilla para HU1

- [x] T062 [HU1] Crear script de datos semilla realistas en packages/database/src/seed.ts

**Checkpoint**: Se puede registrar org, crear áreas, dar de alta usuarios - base para todas las demás historias

---

## Fase 4: Historia de Usuario 2 - Completar Tareas Diarias (Prioridad: P1) 🎯 MVP

**Objetivo**: Personal ve tareas, completa con deslizar/tocar, reporta problemas con foto

**Prueba Independiente**: Ingresar como empleado, ver tareas de hoy, completar una con OK, reportar un problema

### Implementación de API para HU2

- [x] T063 [HU2] Crear rutas de tarea (listar, obtener, crear) en packages/api/src/routes/tasks.ts
- [x] T064 [HU2] Agregar endpoint de completación de tarea en packages/api/src/routes/tasks.ts
- [x] T065 [HU2] Agregar endpoint de completación de ítem de checklist en packages/api/src/routes/tasks.ts
- [x] T066 [HU2] Crear lógica de auto-generación de problemas en packages/api/src/routes/tasks.ts
- [x] T067 [HU2] Crear endpoint de URL prefirmada para subida en packages/api/src/routes/uploads.ts
- [x] T068 [HU2] Crear endpoint de sincronización offline en packages/api/src/routes/sync.ts

### Implementación de Frontend para HU2

- [x] T069 [HU2] Crear página principal (tareas de hoy) en apps/web/app/(dashboard)/page.tsx
- [x] T070 [HU2] Crear componente de tarjeta de tarea en apps/web/components/tasks/task-card.tsx
- [x] T071 [HU2] Crear página de detalle/completación de tarea en apps/web/app/(dashboard)/tasks/[id]/page.tsx
- [x] T072 [HU2] Crear modal de completación de tarea en apps/web/components/tasks/task-completion.tsx
- [x] T073 [HU2] Crear ítem de checklist deslizable en apps/web/components/tasks/swipeable-item.tsx
- [x] T074 [HU2] Crear formulario de reporte de problema en apps/web/components/tasks/problem-report.tsx
- [x] T075 [HU2] Crear componente de captura de cámara/foto en apps/web/components/ui/camera-capture.tsx
- [x] T076 [HU2] Crear hooks de TanStack Query para tareas en apps/web/lib/api/tasks.ts
- [x] T077 [HU2] Implementar cola de tareas offline en apps/web/lib/offline/task-queue.ts
- [x] T078 [HU2] Crear almacenamiento IndexedDB para datos offline en apps/web/lib/offline/idb-store.ts
- [x] T079 [HU2] Implementar manejador de sync en segundo plano en apps/web/public/sw.js

**Checkpoint**: Personal puede completar tareas diarias - propuesta de valor central entregada

---

## Fase 5: Historia de Usuario 3 - Dashboard de Supervisor de Área (Prioridad: P2)

**Objetivo**: Supervisor ve métricas del área, alertas, puede reasignar tareas

**Prueba Independiente**: Ingresar como supervisor, ver dashboard del área, ver score de cumplimiento, reasignar tarea

### Implementación de API para HU3

- [x] T080 [HU3] Agregar endpoint de estadísticas de área en packages/api/src/routes/areas.ts
- [x] T081 [HU3] Agregar lógica de cálculo de cumplimiento en packages/api/src/lib/compliance.ts
- [x] T082 [HU3] Agregar endpoint de reasignación de tarea en packages/api/src/routes/tasks.ts
- [x] T083 [HU3] Agregar endpoint de historial de tareas en packages/api/src/routes/tasks.ts

### Implementación de Frontend para HU3

- [x] T084 [HU3] Crear página de dashboard de área en apps/web/app/(dashboard)/areas/[id]/page.tsx
- [x] T085 [HU3] Crear widget de score de cumplimiento en apps/web/components/dashboard/compliance-score.tsx
- [x] T086 [HU3] Crear componente de lista de alertas en apps/web/components/dashboard/alerts-list.tsx
- [x] T087 [HU3] Crear componente de historial de tareas en apps/web/components/tasks/task-history.tsx
- [x] T088 [HU3] Crear modal de reasignación de tareas en apps/web/components/tasks/task-reassign.tsx
- [x] T089 [HU3] Crear hooks de TanStack Query para dashboard en apps/web/lib/api/dashboard.ts

**Checkpoint**: Supervisores tienen visibilidad del rendimiento de su área

---

## Fase 6: Historia de Usuario 4 - Creación de Tareas (Prioridad: P2)

**Objetivo**: Supervisor crea tareas con recurrencia, asigna a personal

**Prueba Independiente**: Crear tarea única, crear tarea recurrente diaria, verificar en lista del asignado

### Implementación de API para HU4

- [x] T090 [HU4] Agregar endpoint completo de creación de tarea en packages/api/src/routes/tasks.ts
- [x] T091 [HU4] Implementar procesamiento de reglas de recurrencia en packages/api/src/lib/recurrence.ts
- [x] T092 [HU4] Crear job programado para generación de tareas recurrentes en packages/api/src/jobs/

### Implementación de Frontend para HU4

- [x] T093 [HU4] Crear página de creación de tareas en apps/web/app/(dashboard)/tasks/new/page.tsx
- [x] T094 [HU4] Crear componente de formulario de tarea en apps/web/components/tasks/task-form.tsx
- [x] T095 [HU4] Crear componente selector de recurrencia en apps/web/components/tasks/recurrence-selector.tsx
- [x] T096 [HU4] Crear constructor de plantilla de checklist en apps/web/components/tasks/checklist-builder.tsx
- [x] T097 [HU4] Crear componente selector de usuario en apps/web/components/ui/user-selector.tsx

**Checkpoint**: Las tareas pueden crearse, asignarse y configurarse como recurrentes

---

## Fase 7: Historia de Usuario 5 - Notificaciones Push (Prioridad: P3)

**Objetivo**: Usuarios reciben notificaciones push, pueden configurar preferencias

**Prueba Independiente**: Asignar tarea, verificar push recibido, configurar horas de silencio

### Implementación de API para HU5

- [x] T098 [HU5] Crear rutas de notificación en packages/api/src/routes/notifications.ts
- [x] T099 [HU5] Integrar cliente Novu en packages/api/src/lib/novu.ts
- [x] T100 [HU5] Crear servicio de disparo de notificaciones en packages/api/src/services/notifications.ts
- [x] T101 [HU5] Agregar endpoint de registro de dispositivo FCM en packages/api/src/routes/notifications.ts
- [x] T102 [HU5] Implementar lógica de horas de silencio en packages/api/src/services/notifications.ts

### Implementación de Frontend para HU5

- [x] T103 [HU5] Crear página de notificaciones en apps/web/app/(dashboard)/notifications/page.tsx
- [x] T104 [HU5] Crear componente campana de notificaciones en apps/web/components/layout/notification-bell.tsx
- [x] T105 [HU5] Crear página de preferencias de notificación en apps/web/app/(dashboard)/settings/notifications/page.tsx
- [x] T106 [HU5] Implementar registro de token FCM en apps/web/lib/notifications/fcm.ts
- [x] T107 [HU5] Crear manejador de notificaciones push en apps/web/public/firebase-messaging-sw.js

**Checkpoint**: Usuarios reciben notificaciones oportunas con preferencias configurables

---

## Fase 8: Historia de Usuario 6 - Dashboard de Gerente (Prioridad: P3)

**Objetivo**: Gerente ve todas las áreas, tendencias, puede profundizar

**Prueba Independiente**: Ingresar como gerente, ver dashboard multi-área, ver tendencias, entrar en área

### Implementación de API para HU6

- [x] T108 [HU6] Crear endpoint de dashboard de gerente en packages/api/src/routes/dashboard.ts
- [x] T109 [HU6] Agregar endpoint de cálculo de tendencias en packages/api/src/routes/dashboard.ts
- [x] T110 [HU6] Agregar agregación de alertas críticas en packages/api/src/routes/dashboard.ts

### Implementación de Frontend para HU6

- [x] T111 [HU6] Crear página de dashboard de gerente en apps/web/app/(dashboard)/dashboard/page.tsx
- [x] T112 [HU6] Crear componente de grilla de tarjetas de área en apps/web/components/dashboard/area-cards.tsx
- [x] T113 [HU6] Crear componente de gráfico de tendencias en apps/web/components/dashboard/trends-chart.tsx
- [x] T114 [HU6] Crear widget de alertas críticas en apps/web/components/dashboard/critical-alerts.tsx

**Checkpoint**: Gerencia tiene visibilidad ejecutiva de todas las áreas

---

## Fase 9: Pulido y Aspectos Transversales

**Propósito**: Mejoras finales que afectan múltiples historias

- [x] T115 [P] Agregar strings i18n en español (es-AR) en apps/web/lib/i18n/
- [x] T116 [P] Agregar estados de carga y skeletons a todas las páginas
- [x] T117 [P] Agregar error boundaries y páginas de error
- [x] T118 Optimizar imágenes con next/image y R2
- [x] T119 [P] Agregar iconos PWA en apps/web/public/icons/
- [x] T120 Configurar despliegue Vercel en vercel.json
- [x] T121 [P] Agregar meta tags OpenGraph para compartir
- [x] T122 Ejecutar auditoría Lighthouse y corregir problemas de rendimiento
- [x] T123 Auditoría de seguridad: validar RLS, sanitizar inputs
- [x] T124 Ejecutar validación end-to-end de quickstart.md

---

## Dependencias y Orden de Ejecución

### Dependencias de Fases

```text
Fase 1: Configuración ──────────────────────────────────┐
                                                        │
Fase 2: Fundacional ────────────────────────────────────┤
                                                        │
     ┌──────────────────────────────────────────────────┘
     │
     ▼
┌─────────────┐  ┌─────────────┐
│   HU1 (P1)  │  │   HU2 (P1)  │  ← Pueden correr en paralelo después de Fase 2
│   Alta de   │  │  Completar  │
│   Tenant    │──│   Tareas    │  ← HU2 usa entidades de HU1
└─────────────┘  └──────┬──────┘
                        │
     ┌──────────────────┴──────────────────┐
     │                                     │
     ▼                                     ▼
┌─────────────┐                    ┌─────────────┐
│   HU3 (P2)  │                    │   HU4 (P2)  │  ← Pueden correr en paralelo
│  Dashboard  │                    │  Creación   │
│  Supervisor │                    │  de Tareas  │
└─────────────┘                    └─────────────┘
     │                                     │
     └──────────────────┬──────────────────┘
                        │
     ┌──────────────────┴──────────────────┐
     │                                     │
     ▼                                     ▼
┌─────────────┐                    ┌─────────────┐
│   HU5 (P3)  │                    │   HU6 (P3)  │  ← Pueden correr en paralelo
│   Notific.  │                    │  Dashboard  │
│    Push     │                    │   Gerente   │
└─────────────┘                    └─────────────┘
                        │
                        ▼
                ┌─────────────┐
                │   Pulido    │
                └─────────────┘
```

### Dependencias de Historias de Usuario

| Historia | Depende De | Puede Iniciar Después De |
|----------|------------|--------------------------|
| HU1 (Alta de Tenant) | Fase 2 | Fundacional completa |
| HU2 (Completar Tareas) | Fase 2, entidades HU1 | HU1 T051 (sync usuarios) |
| HU3 (Dashboard Supervisor) | HU2 (tareas existen) | HU2 completa |
| HU4 (Creación de Tareas) | HU1 (áreas, usuarios) | HU1 completa |
| HU5 (Notificaciones) | HU2 (triggers de tareas) | HU2 completa |
| HU6 (Dashboard Gerente) | HU3 (stats de área) | HU3 completa |

### Oportunidades de Paralelismo

**Fase 1** (todas en paralelo):

```bash
T002 T003 T004 T005 T006 ← Todas las inicializaciones de paquetes
T008 T009 T010 ← Archivos de configuración
```

**Fase 2** (paralelo agrupado):

```bash
T012 T027 T028 T029 ← Tipos/validadores compartidos
T013-T023 ← Secuencial por dependencias FK, pero dentro T032 T039 T040 T044 T045
```

**Fases 3-8** (paralelo a nivel de historia):

```bash
HU1 + HU2 pueden solaparse después de T051
HU3 + HU4 pueden correr totalmente en paralelo
HU5 + HU6 pueden correr totalmente en paralelo
```

---

## Estrategia de Implementación

### MVP Primero (Historias 1 + 2)

1. Completar Fase 1: Configuración
2. Completar Fase 2: Fundacional (CRÍTICO)
3. Completar Fase 3: HU1 - Alta de Tenant
4. Completar Fase 4: HU2 - Completar Tareas
5. **PARAR Y VALIDAR**: Registrar hotel, crear áreas, asignar y completar tareas
6. Desplegar demo MVP

### Entrega Incremental

| Hito | Historias | Capacidad |
|------|-----------|-----------|
| MVP | HU1 + HU2 | Configuración básica de org, flujo diario de tareas |
| V1.1 | + HU3 + HU4 | Dashboards de supervisor, tareas personalizadas |
| V1.2 | + HU5 + HU6 | Notificaciones completas, vista de gerente |
| V1.3 | + Pulido | Listo para producción, optimizado |

### Distribución Estimada de Tareas

| Fase | Tareas | Oportunidades de Paralelismo |
|------|--------|------------------------------|
| Configuración | 10 | 8 grupos paralelos |
| Fundacional | 37 | 15 oportunidades paralelas |
| HU1 | 15 | 4 oportunidades paralelas |
| HU2 | 17 | 3 oportunidades paralelas |
| HU3 | 10 | 2 oportunidades paralelas |
| HU4 | 8 | 1 oportunidad paralela |
| HU5 | 10 | 2 oportunidades paralelas |
| HU6 | 7 | 1 oportunidad paralela |
| Pulido | 10 | 6 oportunidades paralelas |
| **Total** | **124** | |

---

## Notas

- Tareas [P] = archivos diferentes, sin dependencias de tareas incompletas
- Etiqueta [HUn] mapea tarea a historia de usuario específica para trazabilidad
- Todas las tareas incluyen rutas de archivo exactas para claridad
- MVP = HU1 + HU2 (se puede demostrar valor después de ~62 tareas)
- Hacer commit después de cada tarea o grupo lógico
- Cada historia de usuario se puede probar independientemente en el checkpoint
