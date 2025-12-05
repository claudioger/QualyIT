// Load .env from root
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'NOT FOUND');

// Create database connection (supports local PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // 1. Create demo tenant
    console.log('📦 Creando tenant demo...');
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'Hotel Termas Paradise',
        slug: 'termas-paradise',
        subdomain: 'demo',
        plan: 'pro',
        settings: {
          timezone: 'America/Argentina/Buenos_Aires',
          locale: 'es-AR',
        },
      })
      .returning();

    console.log('   ✓ Tenant creado: ' + tenant.name);

    // 2. Create admin user
    console.log('👤 Creando usuario administrador...');
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        tenantId: tenant.id,
        clerkUserId: 'clerk_demo_admin_001',
        email: 'admin@demo.qualyit.app',
        name: 'Roberto Administrador',
        role: 'admin',
        mustChangePassword: false,
        notificationPreferences: {
          taskAssigned: true,
          taskReminder: true,
          taskOverdue: true,
          problemReported: true,
        },
      })
      .returning();

    console.log('   ✓ Admin creado: ' + adminUser.email);

    // 3. Create areas with hierarchy
    console.log('🏢 Creando áreas...');

    // Root areas
    const [operaciones] = await db
      .insert(schema.areas)
      .values({
        tenantId: tenant.id,
        name: 'Operaciones',
        code: 'OPS',
        sortOrder: 0,
      })
      .returning();

    const [alimentos] = await db
      .insert(schema.areas)
      .values({
        tenantId: tenant.id,
        name: 'Alimentos y Bebidas',
        code: 'AYB',
        sortOrder: 1,
      })
      .returning();

    const [mantenimiento] = await db
      .insert(schema.areas)
      .values({
        tenantId: tenant.id,
        name: 'Mantenimiento',
        code: 'MANT',
        sortOrder: 2,
      })
      .returning();

    // Sub-areas
    const childAreas = await db
      .insert(schema.areas)
      .values([
        { tenantId: tenant.id, parentId: operaciones.id, name: 'Recepción', code: 'RECEP', sortOrder: 0 },
        { tenantId: tenant.id, parentId: operaciones.id, name: 'Housekeeping', code: 'HK', sortOrder: 1 },
        { tenantId: tenant.id, parentId: operaciones.id, name: 'Lavandería', code: 'LAV', sortOrder: 2 },
        { tenantId: tenant.id, parentId: alimentos.id, name: 'Restaurante Principal', code: 'REST', sortOrder: 0 },
        { tenantId: tenant.id, parentId: alimentos.id, name: 'Cocina', code: 'COC', sortOrder: 1 },
        { tenantId: tenant.id, parentId: alimentos.id, name: 'Bar', code: 'BAR', sortOrder: 2 },
        { tenantId: tenant.id, parentId: mantenimiento.id, name: 'Piscina y Spa', code: 'SPA', sortOrder: 0 },
        { tenantId: tenant.id, parentId: mantenimiento.id, name: 'Jardines', code: 'JARD', sortOrder: 1 },
      ])
      .returning();

    const allAreas = [operaciones, alimentos, mantenimiento, ...childAreas];
    console.log('   ✓ ' + allAreas.length + ' áreas creadas (con jerarquía)');

    const recepcion = childAreas[0];
    const housekeeping = childAreas[1];
    const lavanderia = childAreas[2];
    const restaurante = childAreas[3];
    const cocina = childAreas[4];
    const spa = childAreas[6];

    // 4. Create sample users
    console.log('👥 Creando usuarios...');
    const users = await db
      .insert(schema.users)
      .values([
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_manager_001', email: 'maria.garcia@demo.qualyit.app', name: 'María García', role: 'manager', mustChangePassword: true },
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_supervisor_001', email: 'juan.perez@demo.qualyit.app', name: 'Juan Pérez', role: 'supervisor', mustChangePassword: true },
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_supervisor_002', email: 'ana.lopez@demo.qualyit.app', name: 'Ana López', role: 'supervisor', mustChangePassword: true },
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_employee_001', email: 'carlos.rodriguez@demo.qualyit.app', name: 'Carlos Rodríguez', role: 'employee', mustChangePassword: true },
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_employee_002', email: 'laura.martinez@demo.qualyit.app', name: 'Laura Martínez', role: 'employee', mustChangePassword: true },
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_employee_003', email: 'diego.fernandez@demo.qualyit.app', name: 'Diego Fernández', role: 'employee', mustChangePassword: true },
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_employee_004', email: 'sofia.sanchez@demo.qualyit.app', name: 'Sofía Sánchez', role: 'employee', mustChangePassword: true },
        { tenantId: tenant.id, clerkUserId: 'clerk_demo_employee_005', email: 'pablo.gonzalez@demo.qualyit.app', name: 'Pablo González', role: 'employee', mustChangePassword: true },
      ])
      .returning();

    const manager = users[0];
    const supervisor1 = users[1];
    const supervisor2 = users[2];
    const emp1 = users[3];
    const emp2 = users[4];
    const emp3 = users[5];
    const emp4 = users[6];
    const emp5 = users[7];
    console.log('   ✓ ' + users.length + ' usuarios creados');

    // 5. Update areas with responsibles
    await db.update(schema.areas).set({ responsibleId: supervisor1.id }).where(eq(schema.areas.id, housekeeping.id));
    await db.update(schema.areas).set({ responsibleId: supervisor2.id }).where(eq(schema.areas.id, cocina.id));

    // 6. Assign users to areas
    console.log('🔗 Asignando usuarios a áreas...');
    const areaUserAssignments = [
      ...allAreas.map((a) => ({ tenantId: tenant.id, userId: manager.id, areaId: a.id })),
      { tenantId: tenant.id, userId: supervisor1.id, areaId: housekeeping.id },
      { tenantId: tenant.id, userId: supervisor1.id, areaId: lavanderia.id },
      { tenantId: tenant.id, userId: supervisor2.id, areaId: restaurante.id },
      { tenantId: tenant.id, userId: supervisor2.id, areaId: cocina.id },
      { tenantId: tenant.id, userId: emp1.id, areaId: recepcion.id },
      { tenantId: tenant.id, userId: emp2.id, areaId: housekeeping.id },
      { tenantId: tenant.id, userId: emp3.id, areaId: restaurante.id },
      { tenantId: tenant.id, userId: emp4.id, areaId: cocina.id },
      { tenantId: tenant.id, userId: emp5.id, areaId: spa.id },
    ];

    await db.insert(schema.areaUsers).values(areaUserAssignments);
    console.log('   ✓ ' + areaUserAssignments.length + ' asignaciones creadas');

    // 7. Create sample tasks
    console.log('📋 Creando tareas...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdTasks = await db
      .insert(schema.tasks)
      .values([
        {
          tenantId: tenant.id,
          areaId: housekeeping.id,
          title: 'Limpieza de habitaciones Piso 1 (101-110)',
          description: 'Limpieza completa incluyendo baño, cambio de toallas y reposición de amenities',
          type: 'scheduled',
          priority: 'high',
          status: 'pending',
          assignedToId: emp2.id,
          createdById: adminUser.id,
          dueDate: today,
          scheduledTime: '08:00',
          hasChecklist: true,
          recurrenceRule: { frequency: 'daily', interval: 1, timezone: 'America/Argentina/Buenos_Aires' },
        },
        {
          tenantId: tenant.id,
          areaId: cocina.id,
          title: 'Control de temperaturas cámaras frigoríficas',
          description: 'Verificar y registrar temperaturas de todas las cámaras.',
          type: 'scheduled',
          priority: 'critical',
          status: 'pending',
          assignedToId: emp4.id,
          createdById: adminUser.id,
          dueDate: today,
          scheduledTime: '07:00',
          hasChecklist: true,
          recurrenceRule: { frequency: 'daily', interval: 1, timezone: 'America/Argentina/Buenos_Aires' },
        },
        {
          tenantId: tenant.id,
          areaId: restaurante.id,
          title: 'Preparación de mesas para desayuno',
          description: 'Montaje completo de mesas para servicio de desayuno buffet',
          type: 'scheduled',
          priority: 'high',
          status: 'completed',
          assignedToId: emp3.id,
          createdById: adminUser.id,
          dueDate: today,
          scheduledTime: '06:30',
          hasChecklist: true,
          completedAt: new Date(today.getTime() + 7 * 60 * 60 * 1000),
          completedById: emp3.id,
        },
        {
          tenantId: tenant.id,
          areaId: spa.id,
          title: 'Control de cloro y pH de piscina',
          description: 'Medir niveles de cloro (1.0-3.0 ppm) y pH (7.2-7.6).',
          type: 'scheduled',
          priority: 'critical',
          status: 'pending',
          assignedToId: emp5.id,
          createdById: adminUser.id,
          dueDate: today,
          scheduledTime: '08:00',
          hasChecklist: true,
        },
        {
          tenantId: tenant.id,
          areaId: recepcion.id,
          title: 'Verificación de llegadas del día',
          description: 'Revisar reservas, preparar llaves y documentación de check-in',
          type: 'scheduled',
          priority: 'high',
          status: 'pending',
          assignedToId: emp1.id,
          createdById: adminUser.id,
          dueDate: today,
          scheduledTime: '07:00',
          hasChecklist: false,
        },
      ])
      .returning();

    console.log('   ✓ ' + createdTasks.length + ' tareas creadas');

    // 8. Create checklist items
    console.log('✅ Creando items de checklist...');

    await db.insert(schema.checklistItems).values([
      { tenantId: tenant.id, taskId: createdTasks[0].id, description: 'Cambiar ropa de cama', sortOrder: 0 },
      { tenantId: tenant.id, taskId: createdTasks[0].id, description: 'Limpiar y desinfectar baño', sortOrder: 1 },
      { tenantId: tenant.id, taskId: createdTasks[0].id, description: 'Aspirar alfombras', sortOrder: 2 },
      { tenantId: tenant.id, taskId: createdTasks[0].id, description: 'Reponer amenities', sortOrder: 3 },
      { tenantId: tenant.id, taskId: createdTasks[0].id, description: 'Verificar funcionamiento TV y A/C', sortOrder: 4 },
    ]);

    await db.insert(schema.checklistItems).values([
      { tenantId: tenant.id, taskId: createdTasks[1].id, description: 'Cámara de carnes: verificar -18°C', sortOrder: 0 },
      { tenantId: tenant.id, taskId: createdTasks[1].id, description: 'Cámara de lácteos: verificar 0-4°C', sortOrder: 1 },
      { tenantId: tenant.id, taskId: createdTasks[1].id, description: 'Cámara de verduras: verificar 4-8°C', sortOrder: 2 },
      { tenantId: tenant.id, taskId: createdTasks[1].id, description: 'Congelador de postres: verificar -18°C', sortOrder: 3 },
    ]);

    await db.insert(schema.checklistItems).values([
      { tenantId: tenant.id, taskId: createdTasks[3].id, description: 'Medir nivel de cloro (1.0-3.0 ppm)', sortOrder: 0 },
      { tenantId: tenant.id, taskId: createdTasks[3].id, description: 'Medir pH (7.2-7.6)', sortOrder: 1 },
      { tenantId: tenant.id, taskId: createdTasks[3].id, description: 'Verificar temperatura del agua', sortOrder: 2 },
      { tenantId: tenant.id, taskId: createdTasks[3].id, description: 'Revisar estado del filtro', sortOrder: 3 },
    ]);

    console.log('   ✓ Checklists creados');

    // 9. Create task completion for the completed task
    console.log('📝 Creando completaciones...');
    await db.insert(schema.taskCompletions).values({
      tenantId: tenant.id,
      taskId: createdTasks[2].id,
      userId: emp3.id,
      status: 'ok',
      notes: 'Todas las mesas preparadas. Buffet verificado.',
      completedAt: createdTasks[2].completedAt!,
    });

    console.log('   ✓ 1 completación creada');

    // 10. Create sample notifications
    console.log('🔔 Creando notificaciones...');
    await db.insert(schema.notifications).values([
      {
        tenantId: tenant.id,
        userId: emp2.id,
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        body: 'Se te ha asignado la tarea "Limpieza de habitaciones Piso 1"',
        data: { taskId: createdTasks[0].id },
      },
      {
        tenantId: tenant.id,
        userId: emp4.id,
        type: 'task_reminder',
        title: 'Tarea próxima a vencer',
        body: 'La tarea "Control de temperaturas" vence en 1 hora',
        data: { taskId: createdTasks[1].id },
      },
    ]);

    console.log('   ✓ 2 notificaciones creadas');

    console.log('\n✅ Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log('   - 1 tenant: ' + tenant.name);
    console.log('   - ' + (users.length + 1) + ' usuarios (1 admin + ' + users.length + ' staff)');
    console.log('   - ' + allAreas.length + ' áreas (con jerarquía)');
    console.log('   - ' + createdTasks.length + ' tareas con checklists reales');
    console.log('\n🌐 Acceso: https://demo.qualyit.app');
    console.log('📧 Admin: admin@demo.qualyit.app\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
