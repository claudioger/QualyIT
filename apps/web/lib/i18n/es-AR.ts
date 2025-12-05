export const esAR = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    search: 'Buscar',
    filter: 'Filtrar',
    noResults: 'Sin resultados',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    all: 'Todos',
    none: 'Ninguno',
    select: 'Seleccionar',
    required: 'Requerido',
    optional: 'Opcional',
  },

  auth: {
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    signUp: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    welcomeBack: '¡Bienvenido de nuevo!',
    createAccount: 'Crear una cuenta',
  },

  navigation: {
    dashboard: 'Dashboard',
    tasks: 'Tareas',
    areas: 'Áreas',
    users: 'Usuarios',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    profile: 'Perfil',
    help: 'Ayuda',
  },

  tasks: {
    title: 'Tareas',
    myTasks: 'Mis tareas',
    allTasks: 'Todas las tareas',
    newTask: 'Nueva tarea',
    editTask: 'Editar tarea',
    deleteTask: 'Eliminar tarea',
    taskDetails: 'Detalles de la tarea',
    assignedTo: 'Asignado a',
    dueDate: 'Fecha límite',
    priority: 'Prioridad',
    status: 'Estado',
    description: 'Descripción',
    checklist: 'Lista de verificación',
    attachments: 'Adjuntos',
    comments: 'Comentarios',
    history: 'Historial',

    // Status
    pending: 'Pendiente',
    inProgress: 'En progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',

    // Priority
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',

    // Type
    scheduled: 'Programada',
    corrective: 'Correctiva',
    preventive: 'Preventiva',

    // Actions
    complete: 'Completar',
    reportProblem: 'Reportar problema',
    reassign: 'Reasignar',
    duplicate: 'Duplicar',

    // Messages
    taskCompleted: 'Tarea completada exitosamente',
    taskCreated: 'Tarea creada exitosamente',
    taskUpdated: 'Tarea actualizada exitosamente',
    taskDeleted: 'Tarea eliminada exitosamente',
    problemReported: 'Problema reportado exitosamente',
    noTasksToday: 'No hay tareas para hoy',
    allTasksCompleted: '¡Todas las tareas completadas!',
  },

  areas: {
    title: 'Áreas',
    newArea: 'Nueva área',
    editArea: 'Editar área',
    deleteArea: 'Eliminar área',
    areaDetails: 'Detalles del área',
    code: 'Código',
    name: 'Nombre',
    parent: 'Área padre',
    responsible: 'Responsable',
    backupResponsible: 'Responsable suplente',
    children: 'Sub-áreas',
    users: 'Usuarios asignados',
    compliance: 'Cumplimiento',

    // Messages
    areaCreated: 'Área creada exitosamente',
    areaUpdated: 'Área actualizada exitosamente',
    areaDeleted: 'Área eliminada exitosamente',
    cannotDeleteWithChildren: 'No se puede eliminar un área con sub-áreas activas',
  },

  users: {
    title: 'Usuarios',
    newUser: 'Nuevo usuario',
    editUser: 'Editar usuario',
    userDetails: 'Detalles del usuario',
    name: 'Nombre',
    email: 'Email',
    role: 'Rol',
    areas: 'Áreas asignadas',
    active: 'Activo',
    inactive: 'Inactivo',

    // Roles
    admin: 'Administrador',
    manager: 'Gerente',
    supervisor: 'Supervisor',
    employee: 'Empleado',

    // Messages
    userCreated: 'Usuario creado exitosamente',
    userUpdated: 'Usuario actualizado exitosamente',
    userDeactivated: 'Usuario desactivado exitosamente',
  },

  notifications: {
    title: 'Notificaciones',
    markAllRead: 'Marcar todas como leídas',
    settings: 'Configuración de notificaciones',
    noNotifications: 'No hay notificaciones',
    preferences: 'Preferencias',
    quietHours: 'Horas de silencio',
    devices: 'Dispositivos registrados',

    // Types
    taskAssigned: 'Tarea asignada',
    taskReminder: 'Recordatorio de tarea',
    taskOverdue: 'Tarea vencida',
    problemReported: 'Problema reportado',
  },

  dashboard: {
    title: 'Dashboard',
    overview: 'Resumen',
    todaysTasks: 'Tareas de hoy',
    compliance: 'Cumplimiento',
    alerts: 'Alertas',
    trends: 'Tendencias',
    rankings: 'Rankings',
    problems: 'Problemas',

    // Stats
    totalTasks: 'Total de tareas',
    completedTasks: 'Tareas completadas',
    pendingTasks: 'Tareas pendientes',
    overdueTasks: 'Tareas vencidas',
    complianceRate: 'Tasa de cumplimiento',

    // Periods
    today: 'Hoy',
    yesterday: 'Ayer',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana pasada',
    thisMonth: 'Este mes',
    last7Days: 'Últimos 7 días',
    last30Days: 'Últimos 30 días',
    last90Days: 'Últimos 90 días',
  },

  problems: {
    title: 'Problemas',
    reportProblem: 'Reportar problema',
    reason: 'Motivo',
    description: 'Descripción',

    // Reasons
    noTime: 'Sin tiempo',
    noSupplies: 'Sin suministros',
    equipmentBroken: 'Equipo averiado',
    other: 'Otro motivo',

    // Status
    open: 'Abierto',
    assigned: 'Asignado',
    resolved: 'Resuelto',
  },

  errors: {
    generic: 'Ha ocurrido un error inesperado',
    notFound: 'No encontrado',
    unauthorized: 'No autorizado',
    forbidden: 'Acceso denegado',
    serverError: 'Error del servidor',
    networkError: 'Error de conexión',
    validationError: 'Error de validación',
    sessionExpired: 'Tu sesión ha expirado',
    tryAgain: 'Intentar de nuevo',
    goHome: 'Ir al inicio',
  },

  time: {
    just_now: 'Ahora mismo',
    minutes_ago: 'hace {count} minutos',
    hours_ago: 'hace {count} horas',
    days_ago: 'hace {count} días',
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
  },
};

export type TranslationKeys = typeof esAR;
