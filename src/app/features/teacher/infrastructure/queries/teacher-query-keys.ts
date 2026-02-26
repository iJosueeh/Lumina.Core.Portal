// Query keys para organizar y gestionar el caché
export const teacherQueryKeys = {
  // Base key para todo relacionado con teachers
  all: ['teacher'] as const,
  
  // Keys para información del docente
  info: (teacherId: string) => [...teacherQueryKeys.all, 'info', teacherId] as const,
  
  // Keys para cursos del docente
  courses: (teacherId: string) => [...teacherQueryKeys.all, 'courses', teacherId] as const,
  
  // Keys para estadísticas del dashboard
  dashboardStats: (teacherId: string) => [...teacherQueryKeys.all, 'dashboard-stats', teacherId] as const,
  
  // Keys para horarios
  schedule: (teacherId: string) => [...teacherQueryKeys.all, 'schedule', teacherId] as const,
  
  // Keys para estudiantes del docente
  students: (teacherId: string) => [...teacherQueryKeys.all, 'students', teacherId] as const,
  
  // Keys para estudiantes de un curso específico
  courseStudents: (courseId: string) => [...teacherQueryKeys.all, 'students', courseId] as const,
};

// Tiempos de caché recomendados por tipo de dato
export const cacheConfig = {
  // Información del docente (cambia poco)
  teacherInfo: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
  },
  
  // Cursos (cambia ocasionalmente)
  courses: {
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 15 * 60 * 1000,    // 15 minutos
  },
  
  // Estadísticas del dashboard (actualizar frecuentemente)
  dashboardStats: {
    staleTime: 2 * 60 * 1000,  // 2 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  },
  
  // Horarios (cambia poco)
  schedule: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 60 * 60 * 1000,    // 1 hora
  },
  
  // Lista de estudiantes (cache agresivo - datos pesados)
  students: {
    staleTime: 15 * 60 * 1000, // 15 minutos (reducir llamadas HTTP)
    gcTime: 30 * 60 * 1000,    // 30 minutos
    refetchOnMount: false,     // No refetch automático
    refetchOnWindowFocus: false, // No refetch al volver a la ventana
  },
};
