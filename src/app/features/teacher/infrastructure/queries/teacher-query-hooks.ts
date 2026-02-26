import { inject } from '@angular/core';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { TeacherQueryService } from './teacher-query.service';
import { TeacherStudentsQueryService } from '../../application/services/teacher-students-query.service';
import { teacherQueryKeys, cacheConfig } from './teacher-query-keys';

/**
 * Custom hooks para las queries del teacher dashboard
 * Utilizan TanStack Query para manejar caché, loading states, y refetching
 */

/**
 * Hook para obtener información del docente con caché
 */
export function useTeacherInfo(teacherId: string) {
  const queryService = inject(TeacherQueryService);
  
  return injectQuery(() => ({
    queryKey: teacherQueryKeys.info(teacherId),
    queryFn: () => queryService.getTeacherInfo(teacherId),
    staleTime: cacheConfig.teacherInfo.staleTime,
    gcTime: cacheConfig.teacherInfo.gcTime,
    enabled: !!teacherId, // Solo ejecutar si hay teacherId
  }));
}

/**
 * Hook para obtener los cursos del docente
 */
export function useTeacherCourses(teacherId: string) {
  const queryService = inject(TeacherQueryService);
  
  return injectQuery(() => ({
    queryKey: teacherQueryKeys.courses(teacherId),
    queryFn: () => queryService.getTeacherCourses(teacherId),
    staleTime: cacheConfig.courses.staleTime,
    gcTime: cacheConfig.courses.gcTime,
    enabled: !!teacherId,
  }));
}

/**
 * Hook para obtener los estudiantes del docente
 * OPTIMIZADO: Cache agresivo para reducir llamadas HTTP masivas
 */
export function useTeacherStudents(teacherId: string, options?: { enabled?: boolean }) {
  const studentsQueryService = inject(TeacherStudentsQueryService);
  
  return injectQuery(() => ({
    queryKey: teacherQueryKeys.students(teacherId),
    queryFn: () => studentsQueryService.getTeacherStudents(teacherId),
    staleTime: cacheConfig.students.staleTime,
    gcTime: cacheConfig.students.gcTime,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: options?.enabled !== undefined ? options.enabled : !!teacherId,
  }));
}

/**
 * Hook para obtener las estadísticas del dashboard
 */
export function useDashboardStats(teacherId: string) {
  const queryService = inject(TeacherQueryService);
  
  return injectQuery(() => ({
    queryKey: teacherQueryKeys.dashboardStats(teacherId),
    queryFn: () => queryService.getDashboardStats(teacherId),
    staleTime: cacheConfig.dashboardStats.staleTime,
    gcTime: cacheConfig.dashboardStats.gcTime,
    enabled: !!teacherId,
    // Refetch automáticamente cada 5 minutos si el usuario está activo
    refetchInterval: 5 * 60 * 1000,
  }));
}

/**
 * Hook para obtener el horario del docente
 */
export function useTeacherSchedule(teacherId: string) {
  const queryService = inject(TeacherQueryService);
  
  return injectQuery(() => ({
    queryKey: teacherQueryKeys.schedule(teacherId),
    queryFn: () => queryService.getTeacherSchedule(teacherId),
    staleTime: cacheConfig.schedule.staleTime,
    gcTime: cacheConfig.schedule.gcTime,
    enabled: !!teacherId,
  }));
}

/**
 * Hook para obtener estudiantes de un curso
 */
export function useCourseStudents(courseId: string) {
  const queryService = inject(TeacherQueryService);
  
  return injectQuery(() => ({
    queryKey: teacherQueryKeys.courseStudents(courseId),
    queryFn: () => queryService.getCourseStudents(courseId),
    staleTime: cacheConfig.students.staleTime,
    gcTime: cacheConfig.students.gcTime,
    enabled: !!courseId,
  }));
}

/**
 * Hook para invalidar el caché del dashboard
 * Útil después de crear/actualizar/eliminar datos
 */
export function useInvalidateTeacherCache() {
  const queryClient = injectQueryClient();
  
  return {
    // Invalidar toda la información del teacher
    invalidateAll: (teacherId: string) => {
      queryClient.invalidateQueries({ 
        queryKey: teacherQueryKeys.all 
      });
    },
    
    // Invalidar solo las estadísticas
    invalidateStats: (teacherId: string) => {
      queryClient.invalidateQueries({ 
        queryKey: teacherQueryKeys.dashboardStats(teacherId) 
      });
    },
    
    // Invalidar solo los cursos
    invalidateCourses: (teacherId: string) => {
      queryClient.invalidateQueries({ 
        queryKey: teacherQueryKeys.courses(teacherId) 
      });
    },
    
    // Invalidar información del docente
    invalidateInfo: (teacherId: string) => {
      queryClient.invalidateQueries({ 
        queryKey: teacherQueryKeys.info(teacherId) 
      });
    },
    
    // Refetch inmediato (útil después de mutaciones)
    refetchStats: (teacherId: string) => {
      queryClient.refetchQueries({ 
        queryKey: teacherQueryKeys.dashboardStats(teacherId) 
      });
    },
  };
}


