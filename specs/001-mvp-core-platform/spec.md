# Especificación de Funcionalidad: Plataforma MVP Core

**Rama de Funcionalidad**: `001-mvp-core-platform`
**Creado**: 2025-12-03
**Estado**: Borrador
**Entrada**: QualyIT - Sistema de Gestión de Calidad y Cumplimiento Empresarial (Fase MVP)

## Resumen

QualyIT MVP entrega la plataforma fundacional para gestión de calidad en negocios de hotelería.
Esta fase establece infraestructura SaaS multi-tenant, jerarquía organizacional, gestión de
usuarios, flujo de tareas y sistema de notificaciones. El objetivo es un sistema funcional que
el personal del hotel pueda usar inmediatamente para gestión diaria de tareas con experiencia
móvil sin fricción.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Alta de Tenant y Configuración Organizacional (Prioridad: P1)

Un administrador de hotel registra su organización en QualyIT, configura la estructura
organizacional (áreas como Recepción, Housekeeping, Cocina, Mantenimiento), y da de alta a los
miembros del equipo con sus roles apropiados desde el panel de administración. Esta es la base
que habilita toda la demás funcionalidad.

**Por qué esta prioridad**: Sin configuración de tenant y estructura organizacional, ninguna otra
funcionalidad puede operar. Esta es la puerta de entrada a toda la plataforma.

**Prueba Independiente**: Se puede probar completamente registrando un nuevo hotel, creando 3-4
áreas con jerarquía, y dando de alta 2-3 usuarios con diferentes roles. Entrega valor inmediato
estableciendo la base organizacional.

**Escenarios de Aceptación**:

1. **Dado** que un gerente de hotel visita QualyIT, **Cuando** completa el registro con nombre
   de organización y subdominio, **Entonces** su tenant es creado y se convierte en admin.

2. **Dado** que un admin está logueado, **Cuando** crea un área (ej: "Cocina") con un responsable,
   **Entonces** el área aparece en el árbol organizacional.

3. **Dado** que un admin ha creado áreas, **Cuando** crea una sub-área (ej: "Cocina Fría" bajo
   "Cocina"), **Entonces** la jerarquía se muestra correctamente.

4. **Dado** que un admin quiere agregar personal, **Cuando** crea un nuevo usuario desde el panel
   de administración con email, nombre, rol y contraseña temporal, **Entonces** el usuario queda
   registrado y puede iniciar sesión.

5. **Dado** que un usuario fue creado por el admin, **Cuando** inicia sesión por primera vez,
   **Entonces** el sistema le solicita cambiar su contraseña temporal por una definitiva.

6. **Dado** que un usuario cambió su contraseña, **Cuando** accede al sistema, **Entonces** puede
   configurar autenticación biométrica (huella/rostro) para futuros accesos.

---

### Historia de Usuario 2 - Completar Tareas Diarias por Personal (Prioridad: P1)

Un supervisor de cocina abre la app al inicio de su turno, ve sus tareas diarias (apertura cocina,
control temperaturas, etc.), y las completa con simples toques/deslizamientos. Los problemas se
reportan con una foto y un toque en el motivo. Este es el flujo de trabajo diario central.

**Por qué esta prioridad**: Esta es la propuesta de valor principal - hacer que el cumplimiento de
calidad sea rápido y sin fricción para el personal. Sin esto, el sistema no provee valor operativo.

**Prueba Independiente**: Se puede probar ingresando como empleado, viendo las tareas asignadas
para hoy, completando tareas con respuestas OK/NO, y reportando un problema con evidencia
fotográfica.

**Escenarios de Aceptación**:

1. **Dado** que un empleado abre la app, **Cuando** ve la pantalla principal, **Entonces** ve sus
   tareas de hoy ordenadas por hora, con las completadas marcadas.

2. **Dado** que un empleado tiene una tarea pendiente, **Cuando** toca "Hacer" en una tarea de
   verificación simple, **Entonces** ve una opción simple OK/NO (pulgar arriba/abajo).

3. **Dado** que un empleado selecciona OK, **Cuando** opcionalmente agrega una foto o nota,
   **Entonces** la tarea se marca completa con timestamp y su nombre.

4. **Dado** que un empleado selecciona NO (problema), **Cuando** toma una foto y selecciona un
   motivo de las opciones predefinidas, **Entonces** se crea automáticamente una tarea correctiva.

5. **Dado** que un empleado tiene una tarea con checklist (múltiples ítems), **Cuando** desliza a
   la derecha en cada ítem, **Entonces** los ítems se marcan OK; deslizar a la izquierda marca NO
   y solicita evidencia.

6. **Dado** que todos los ítems del checklist están completados, **Cuando** el empleado ve el
   checklist, **Entonces** el progreso muestra 100% y la tarea padre se marca completa.

---

### Historia de Usuario 3 - Dashboard de Supervisor de Área (Prioridad: P2)

Un supervisor de cocina (jefe de área) abre la app y ve el estado de su área de un vistazo:
puntaje de cumplimiento general, tareas pendientes, problemas reportados y vencimientos próximos.
Puede rápidamente asignar o reasignar tareas.

**Por qué esta prioridad**: Los supervisores necesitan visibilidad para gestionar sus equipos.
Esto permite supervisión sin requerir acceso desktop.

**Prueba Independiente**: Se puede probar ingresando como supervisor, viendo el dashboard del
área con métricas, viendo una alerta, y reasignando una tarea a otro miembro del equipo.

**Escenarios de Aceptación**:

1. **Dado** que un supervisor abre la app, **Cuando** ve su dashboard de área, **Entonces** ve
   porcentaje de cumplimiento, tareas hechas/pendientes, y alertas activas.

2. **Dado** que hay problemas reportados en el área, **Cuando** el supervisor ve las alertas,
   **Entonces** ve cada problema con quién reportó, hora, foto y motivo.

3. **Dado** que un supervisor ve un problema, **Cuando** toca "Asignar", **Entonces** puede
   seleccionar un miembro del equipo o tercero para resolverlo.

4. **Dado** que hay tareas vencidas en el área, **Cuando** el supervisor ve el dashboard,
   **Entonces** las tareas vencidas se resaltan con indicador visual de urgencia.

5. **Dado** que un supervisor quiere ver quién hizo qué, **Cuando** ve el historial de tareas,
   **Entonces** ve tareas completadas con timestamps, usuarios, y cualquier nota/foto.

---

### Historia de Usuario 4 - Creación y Asignación de Tareas (Prioridad: P2)

Un supervisor o admin crea una nueva tarea (programada, correctiva o preventiva), la asigna a un
empleado, establece fecha de vencimiento y prioridad, y opcionalmente la hace recurrente.

**Por qué esta prioridad**: Aunque el sistema viene con tareas predefinidas, la capacidad de crear
tareas personalizadas es esencial para flexibilidad del mundo real.

**Prueba Independiente**: Se puede probar creando una tarea única, una tarea recurrente diaria, y
verificando que ambas aparecen correctamente en las listas de los asignados.

**Escenarios de Aceptación**:

1. **Dado** que un supervisor toca el botón "+", **Cuando** completa título, asignado y fecha de
   vencimiento, **Entonces** se crea una nueva tarea y el asignado es notificado.

2. **Dado** que un supervisor crea una tarea, **Cuando** habilita "Recurrente" y configura
   frecuencia diaria, **Entonces** la tarea se regenera cada día automáticamente.

3. **Dado** que se crea una tarea correctiva desde un reporte de problema, **Cuando** se guarda
   la tarea, **Entonces** se vincula al problema original con la evidencia fotográfica adjunta.

4. **Dado** que una tarea tiene una plantilla de checklist, **Cuando** el supervisor la
   selecciona, **Entonces** la tarea incluye todos los ítems del checklist de la plantilla.

5. **Dado** que se asigna una tarea, **Cuando** el asignado abre la app, **Entonces** ve la nueva
   tarea con un badge de notificación.

---

### Historia de Usuario 5 - Notificaciones Push y Alertas (Prioridad: P3)

Los usuarios reciben notificaciones push oportunas para tareas asignadas, vencimientos próximos,
ítems vencidos y problemas reportados en su área. Las notificaciones son configurables por
usuario.

**Por qué esta prioridad**: Las notificaciones aseguran que los usuarios no se pierdan ítems
importantes, pero el flujo central puede funcionar con usuarios revisando la app manualmente.

**Prueba Independiente**: Se puede probar creando una tarea, verificando que se recibe la
notificación push, y probando las notificaciones de recordatorio de vencimiento.

**Escenarios de Aceptación**:

1. **Dado** que se asigna una tarea a un usuario, **Cuando** se guarda la asignación, **Entonces**
   el usuario recibe una notificación push dentro de 30 segundos.

2. **Dado** que una tarea vence en 1 hora, **Cuando** el sistema verifica vencimientos,
   **Entonces** el asignado recibe una notificación de recordatorio.

3. **Dado** que una tarea se vuelve vencida, **Cuando** pasa el umbral de vencimiento, **Entonces**
   tanto el asignado como su supervisor reciben notificaciones de alerta.

4. **Dado** que se reporta un problema en un área, **Cuando** se envía el reporte, **Entonces** el
   supervisor del área recibe una notificación inmediata.

5. **Dado** que un usuario quiere reducir notificaciones, **Cuando** accede a configuración de
   notificaciones, **Entonces** puede alternar tipos de notificación y establecer horas de
   silencio.

---

### Historia de Usuario 6 - Vista General del Gerente (Prioridad: P3)

Un gerente general ve un dashboard de alto nivel mostrando puntajes de cumplimiento de todas las
áreas, alertas críticas y fechas importantes próximas. Puede profundizar en cualquier área.

**Por qué esta prioridad**: La visibilidad ejecutiva es importante pero no bloquea las operaciones
diarias.

**Prueba Independiente**: Se puede probar ingresando como gerente, viendo el dashboard multi-área,
identificando el área de menor rendimiento, y profundizando en sus detalles.

**Escenarios de Aceptación**:

1. **Dado** que un gerente abre la app, **Cuando** ve el dashboard principal, **Entonces** ve
   todas las áreas con porcentajes de cumplimiento y estado codificado por color.

2. **Dado** que cualquier área tiene alertas críticas, **Cuando** ve el dashboard, **Entonces**
   las alertas se muestran prominentemente con badges de conteo.

3. **Dado** que un gerente toca un área, **Cuando** se abre la vista del área, **Entonces** ve el
   mismo detalle que vería un supervisor para esa área.

4. **Dado** que el gerente quiere datos de tendencia, **Cuando** ve la sección de tendencias,
   **Entonces** ve la evolución del puntaje de cumplimiento de los últimos 30 días.

---

### Casos Borde

- ¿Qué pasa cuando se elimina un usuario de la organización mientras tiene tareas asignadas?
  Las tareas se reasignan al supervisor del área automáticamente.

- ¿Qué pasa cuando no hay red disponible durante la completación de tareas?
  Las tareas se completan localmente y sincronizan cuando se restaura la conexión (offline-first).

- ¿Qué pasa cuando un usuario pertenece a múltiples áreas?
  Ve tareas de todas sus áreas, agrupadas por área en su pantalla principal.

- ¿Qué pasa cuando el asignado de una tarea recurrente está de vacaciones?
  El supervisor recibe notificación para reasignar; la tarea muestra estado "Sin asignar".

- ¿Qué pasa cuando dos usuarios intentan completar la misma tarea simultáneamente?
  La primera completación gana; el segundo usuario ve mensaje "Ya completada por [nombre]".

- ¿Qué pasa cuando falla la subida de foto?
  La foto se encola para reintentar; la tarea muestra indicador "Foto pendiente de subir".

## Requisitos *(obligatorio)*

### Requisitos Funcionales

**Tenant y Organización**

- **RF-001**: El sistema DEBE soportar arquitectura multi-tenant donde los datos de cada
  organización están completamente aislados de otros.
- **RF-002**: El sistema DEBE permitir que las organizaciones tengan un subdominio único
  (ej: termas.qualyit.app).
- **RF-003**: El sistema DEBE soportar profundidad ilimitada de jerarquía para áreas
  organizacionales (mínimo 5 niveles: Empresa → División → Área → Sub-área → Sector).
- **RF-004**: Cada área DEBE tener exactamente un responsable (titular) y opcionalmente un backup.

**Gestión de Usuarios**

- **RF-005**: El sistema DEBE soportar acceso basado en roles con al menos: Admin, Gerente,
  Supervisor, Empleado.
- **RF-006**: Los usuarios DEBEN ser creados por un administrador desde el panel de
  administración, con email, nombre, rol, áreas asignadas y contraseña temporal.
- **RF-007**: En el primer inicio de sesión, el sistema DEBE requerir que el usuario cambie su
  contraseña temporal por una definitiva.
- **RF-008**: Los usuarios DEBEN poder configurar autenticación biométrica (huella/rostro)
  después del primer login.
- **RF-009**: Cada usuario DEBE estar asignado a al menos un área.

**Gestión de Tareas**

- **RF-010**: Las tareas DEBEN soportar tipos: Programada, Correctiva, Preventiva.
- **RF-011**: Las tareas DEBEN tener prioridades: Crítica, Alta, Media, Baja.
- **RF-012**: Las tareas DEBEN soportar patrones de recurrencia: diario, semanal, mensual,
  personalizado.
- **RF-013**: Las tareas simples DEBEN ser completables con máximo 3 toques desde la pantalla
  principal.
- **RF-014**: Las tareas DEBEN soportar checklists embebidos con completación individual de ítems.
- **RF-015**: Los ítems de checklist DEBEN ser completables vía gesto de deslizamiento
  (derecha=OK, izquierda=NO).
- **RF-016**: Cuando un ítem de checklist se marca NO, el sistema DEBE requerir evidencia
  fotográfica y selección de motivo.
- **RF-017**: El sistema DEBE auto-generar tareas correctivas cuando se reportan problemas.
- **RF-018**: Las tareas DEBEN soportar adjuntos multimedia (fotos de cámara, archivos).
- **RF-019**: El sistema DEBE registrar timestamp de completación, usuario que completó y
  cualquier nota/evidencia.

**Notificaciones**

- **RF-020**: El sistema DEBE enviar notificaciones push para: asignación de tarea, vencimientos
  próximos, tareas vencidas, problemas reportados.
- **RF-021**: Los usuarios DEBEN poder configurar qué notificaciones reciben.
- **RF-022**: Los usuarios DEBEN poder establecer "horas de silencio" cuando las notificaciones
  están silenciadas.
- **RF-023**: Las alertas críticas (seguridad, cumplimiento) DEBEN ignorar las horas de silencio.

**Offline y Sincronización**

- **RF-024**: El sistema DEBE funcionar offline para ver tareas asignadas y completarlas.
- **RF-025**: Las completaciones offline DEBEN sincronizar automáticamente cuando se restaura
  la conexión.
- **RF-026**: El sistema DEBE mostrar indicador claro cuando opera en modo offline.
- **RF-027**: Las fotos tomadas offline DEBEN encolarse para subida y sincronizar cuando esté
  online.

**Dashboard y Reportes**

- **RF-028**: El dashboard de área DEBE mostrar: porcentaje de cumplimiento, tareas
  pendientes/completadas, alertas activas.
- **RF-029**: El dashboard de gerente DEBE mostrar todas las áreas con puntajes de cumplimiento
  comparativos.
- **RF-030**: El sistema DEBE calcular puntajes de cumplimiento basados en tasas de completación
  de tareas.
- **RF-031**: Los dashboards DEBEN actualizarse en casi tiempo real (dentro de 30 segundos de
  cambios).

### Entidades Clave

- **Tenant**: Una organización usando QualyIT (hotel, cadena de restaurantes, etc.). Tiene
  subdominio, nivel de plan, configuraciones. Contiene todas las demás entidades.

- **Área**: Unidad organizacional dentro de un tenant. Tiene nombre, código, área padre (para
  jerarquía), usuario responsable. Contiene tareas y usuarios.

- **Usuario**: Una persona con acceso al sistema. Tiene email, nombre, rol, áreas asignadas,
  preferencias de notificación, hash de contraseña. Pertenece a un tenant.

- **Tarea**: Un ítem de trabajo a completar. Tiene título, descripción, tipo, prioridad, fecha
  de vencimiento, regla de recurrencia, usuario asignado, área, estado, datos de completación.
  Puede contener ítems de checklist.

- **ItemChecklist**: Un punto de verificación individual dentro de una tarea. Tiene descripción,
  orden, estado de completación, evidencia si se marcó NO.

- **CompletacionTarea**: Registro de una tarea siendo completada. Tiene timestamp, usuario,
  notas, fotos, puntaje. Se vincula a tarea y cualquier problema reportado.

- **Problema**: Un issue reportado durante completación de tarea. Tiene descripción, categoría de
  motivo, fotos, estado, tarea correctiva vinculada.

- **Notificacion**: Un mensaje enviado a un usuario. Tiene tipo, contenido, estado de lectura,
  timestamp, referencia a entidad relacionada.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **CE-001**: El personal puede completar una tarea de verificación simple en menos de 5 segundos
  (máximo 3 toques).

- **CE-002**: El personal puede completar un checklist de 10 ítems en menos de 30 segundos usando
  gestos de deslizamiento.

- **CE-003**: Una nueva organización puede configurarse completamente (registro, 5 áreas, 10
  usuarios) en menos de 15 minutos.

- **CE-004**: 95% de las notificaciones push se entregan dentro de 30 segundos del evento
  disparador.

- **CE-005**: El sistema permanece completamente funcional offline por al menos 8 horas de uso
  típico.

- **CE-006**: Los datos offline sincronizan completamente dentro de 60 segundos de restauración
  de conexión.

- **CE-007**: Los datos del dashboard se refrescan dentro de 30 segundos de cualquier
  completación de tarea.

- **CE-008**: 90% de los usuarios primerizos pueden completar su primera tarea sin asistencia.

- **CE-009**: El sistema soporta 100 usuarios concurrentes por tenant sin degradación de
  rendimiento.

- **CE-010**: Las subidas de evidencia fotográfica completan dentro de 10 segundos en conexión
  móvil estándar.

## Supuestos

- Los usuarios tienen smartphones con capacidad de cámara (iOS 14+ o Android 10+).
- Las organizaciones tienen conectividad básica a internet, aunque puede ser intermitente.
- El despliegue inicial se enfoca en idioma español (locale argentino).
- Los hoteles son el vertical inicial primario, informando patrones de UX.
- Los usuarios son creados por administradores con contraseña temporal; cambian en primer login.
- Las categorías simples de motivo para problemas (falta tiempo, falta insumos, equipo roto, otro)
  son suficientes para MVP; categorías personalizadas pueden venir después.
- El cálculo de puntaje de cumplimiento usa tasa de completación simple; puntaje ponderado es
  post-MVP.
- La jerarquía de roles es fija para MVP (Admin > Gerente > Supervisor > Empleado); roles
  personalizados post-MVP.
