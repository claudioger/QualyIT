<!--
INFORME DE SINCRONIZACIÓN
==========================
Cambio de versión: 1.0.0 → 1.1.0 (Actualización menor)
Principios modificados:
  - IV. Seguridad Multitenancy SaaS: Cambiado de Clerk invitations a gestión directa de usuarios
Secciones añadidas: Ninguna
Secciones eliminadas: Ninguna
Plantillas que requieren actualización:
  - specs/001-mvp-core-platform/spec.md ⚠️ (requiere actualizar flujo de usuarios)
  - specs/001-mvp-core-platform/tasks.md ⚠️ (requiere actualizar tareas de usuarios)
TODOs pendientes: Ninguno
-->

# Constitución QualyIT

## Principios Fundamentales

### I. UX Sin Fricción

Toda interacción del usuario DEBE completarse en 3 toques o menos. El sistema DEBE funcionar para
usuarios con tiempo limitado (supervisores entre servicios, personal con ventanas de 2 minutos).
Todas las operaciones complejas DEBEN simplificarse a interfaces basadas en toques con detalles
opcionales.

**Innegociables:**

- Máximo 3 toques para cualquier acción común
- Cero entrada de texto obligatoria (todas las interacciones vía selección/toques)
- Captura de foto en 1 toque con cámara integrada
- Voz a texto para notas opcionales
- Gestos de deslizamiento para completar rápido (deslizar derecha = OK, izquierda = NO)
- Atajos contextuales y sugerencias inteligentes

**Fundamento:** El personal de hotelería no puede perder tiempo en interfaces burocráticas. El
sistema DEBE adaptarse a su flujo de trabajo, no al revés. Un supervisor completando un checklist
de 10 ítems DEBE terminar en menos de 30 segundos.

### II. Solo Datos Reales

Todo desarrollo DEBE usar estructuras de datos e integraciones reales. Los datos mock, contenido
placeholder y respuestas simuladas están PROHIBIDOS. Cada funcionalidad DEBE implementarse con
flujos de datos listos para producción desde el inicio.

**Innegociables:**

- Sin datos mock en ninguna fase de desarrollo
- Todos los endpoints de API DEBEN conectar a operaciones reales de base de datos
- Los datos de prueba DEBEN ser realistas y representativos de escenarios de producción
- Sin comentarios TODO indicando implementación real diferida
- Sin valores placeholder hardcodeados que requieran reemplazo futuro

**Fundamento:** Los datos mock crean señales falsas de progreso y deuda técnica. Reemplazar mocks
con implementaciones reales después causa retrabajo e introduce bugs. Datos reales desde el día
uno aseguran seguimiento preciso del progreso y preparación para producción.

### III. Arquitectura Mobile-First

La interfaz principal es móvil. Desktop es una experiencia móvil escalada, no al revés. Todas las
funcionalidades DEBEN diseñarse para interacción táctil primero, luego adaptarse para dispositivos
con puntero.

**Innegociables:**

- PWA con capacidad offline completa (integración Workbox)
- Gestos nativos (deslizar, pull-to-refresh, long-press)
- Navegación inferior para accesibilidad en zona del pulgar
- Retroalimentación háptica en acciones críticas
- Integración de cámara, escáner QR/NFC para identificación de equipos
- Geolocalización para tareas de campo
- Autenticación biométrica (huella/rostro)
- Notificaciones push vía Firebase Cloud Messaging

**Fundamento:** El personal usa dispositivos móviles en el campo (cocinas, habitaciones, áreas de
mantenimiento). El uso de desktop es secundario (dashboards de gerencia). Priorizar móvil asegura
que la herramienta funcione donde más importa.

### IV. Seguridad Multitenancy SaaS

El aislamiento de datos entre tenants es absoluto. Ningún tenant DEBE jamás acceder a datos de
otro tenant bajo ninguna circunstancia. Row-Level Security (RLS) DEBE aplicarse a nivel de base
de datos.

**Innegociables:**

- Toda tabla DEBE incluir columna `tenant_id`
- Las políticas RLS de PostgreSQL DEBEN filtrar todas las consultas por tenant actual
- La capa de API DEBE validar el contexto del tenant antes de cualquier operación
- Backups independientes por tenant
- Resolución de tenant basada en subdominio (ej: termas.qualyit.app)
- Autenticación con Clerk a nivel de organización
- **Gestión de usuarios desde panel de administración** (no invitaciones por email)
- El administrador crea usuarios con email y contraseña temporal
- Los usuarios cambian su contraseña en el primer inicio de sesión

**Fundamento:** Como plataforma SaaS sirviendo múltiples hoteles y empresas, las brechas de datos
entre tenants serían catastróficas. Defensa en profundidad con RLS asegura aislamiento incluso si
la lógica de aplicación falla.

### V. Cumplimiento Invisible de Estándares

Los estándares de calidad (ISO 9001, BPM, HACCP) DEBEN aplicarse invisiblemente. Los usuarios ven
preguntas legibles ("¿Pisos limpios?"), mientras el sistema mapea respuestas a requisitos
regulatorios internamente.

**Innegociables:**

- El lenguaje visible al usuario DEBE ser español simple (sin jerga técnica)
- El mapeo interno a estándares DEBE ser automático y transparente
- Los informes de auditoría DEBEN generarse automáticamente con trazabilidad completa
- La preparación para certificación ("¿Pasaríamos la auditoría hoy?") DEBE ser calculable en
  cualquier momento
- La recolección de evidencia (fotos, firmas) DEBE ser fluida y no intrusiva

**Fundamento:** El personal no son expertos en cumplimiento. El sistema DEBE manejar la
complejidad regulatoria mientras presenta interfaces simples y accionables. Los auditores
obtienen datos estructurados; los usuarios obtienen tareas fáciles.

## Estándares Técnicos

**Stack (Vanguardia 2025):**

- **Frontend:** Next.js 15 (App Router, React 19, Server Components, Turbopack)
- **UI:** Shadcn/UI + Magic UI + Aceternity UI + Tailwind CSS v4
- **Estado:** TanStack Query v5 + Zustand v5
- **Backend:** Hono (edge-first, ultra-rápido)
- **ORM:** Drizzle ORM (type-safe)
- **Base de datos:** Neon PostgreSQL (serverless, branching)
- **Caché:** Upstash Redis (serverless)
- **Almacenamiento:** Cloudflare R2 (compatible S3, sin costos de egreso)
- **Auth:** Clerk (UX moderna, organizaciones, RBAC)
- **Hosting:** Vercel (frontend) + Cloudflare (CDN/WAF)
- **Notificaciones:** Novu + Firebase Cloud Messaging + Resend
- **Pagos:** Stripe + MercadoPago (LATAM)

**Objetivos de Rendimiento:**

- First Contentful Paint < 1.5s en 3G
- Time to Interactive < 3s
- Offline-first con sincronización en segundo plano
- Respuestas de API < 200ms p95

**Idioma:** Español (es-AR) con preparación i18n para expansión futura.

## Flujo de Trabajo de Desarrollo

**Estrategia de Branches:** Feature branches desde `main`, revisiones basadas en PR.

**Puertas de Calidad:**

- TypeScript modo estricto sin tipos `any`
- ESLint + Prettier obligatorios
- Todos los endpoints DEBEN tener documentación OpenAPI
- Migraciones de base de datos vía Drizzle Kit
- Tests E2E para journeys críticos de usuario (Playwright)

**Despliegue:**

- Preview deployments por PR (Vercel)
- Ambiente de staging para pruebas de integración
- Deploys a producción requieren CI pasando y aprobación de revisión

## Gobernanza

Esta Constitución prevalece sobre todas las demás prácticas de desarrollo para QualyIT. Cualquier
desviación de estos principios DEBE documentarse con justificación explícita en el archivo plan.md
relevante bajo la sección "Seguimiento de Complejidad".

**Procedimiento de Enmienda:**

1. Proponer cambios vía PR a `.specify/memory/constitution.md`
2. Documentar fundamento e impacto en funcionalidades existentes
3. Actualizar número de versión siguiendo versionado semántico:
   - MAJOR: Eliminación de principios o redefiniciones incompatibles
   - MINOR: Nuevos principios o guía materialmente expandida
   - PATCH: Clarificaciones y correcciones de errores
4. Propagar cambios a plantillas dependientes si están afectadas

**Revisión de Cumplimiento:** Todos los PRs DEBEN verificar adherencia a los principios de la
Constitución antes de merge. La sección "Constitution Check" del plan-template.md DEBE pasar
antes de que comience la implementación.

**Versión**: 1.1.0 | **Ratificada**: 2025-12-03 | **Última Enmienda**: 2025-12-03
