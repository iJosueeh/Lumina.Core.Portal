import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { 
  useTeacherInfo, 
  useDashboardStats, 
  useTeacherCourses,
  useInvalidateTeacherCache 
} from '@features/teacher/infrastructure/queries/teacher-query-hooks';

@Component({
  selector: 'app-teacher-dashboard-with-query',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-dashboard.component.html',
})
export class TeacherDashboardWithQueryComponent implements OnInit {
  private authRepository = inject(AuthRepository);
  private router = inject(Router);
  
  // ID del usuario actual
  private currentUserId = computed(() => this.authRepository.getCurrentUser()?.id ?? '');
  
  teacherInfoQuery = useTeacherInfo(this.currentUserId());
  dashboardStatsQuery = useDashboardStats(this.currentUserId());
  coursesQuery = useTeacherCourses(this.currentUserId());
  
  // Funciones para invalidar/refetch caché
  cacheManager = useInvalidateTeacherCache();

  // Computed signals para acceder fácilmente a los datos
  teacherName = computed(() => {
    const data = this.teacherInfoQuery.data();
    return data?.nombre?.split(' ')[0] || 'Docente';
  });

  stats = computed(() => this.dashboardStatsQuery.data());
  courses = computed(() => this.coursesQuery.data() || []);

  // Alias para compatibilidad con el template
  dashboardStats = this.stats;
  
  // Estados de loading individuales
  isLoadingStats = computed(() => this.dashboardStatsQuery.isPending());
  isLoadingCourses = computed(() => this.coursesQuery.isPending());

  // Estados de error
  hasError = computed(() => 
    this.teacherInfoQuery.isError() || 
    this.dashboardStatsQuery.isError() || 
    this.coursesQuery.isError()
  );

  // Computed para estadísticas específicas
  totalCourses = computed(() => this.stats()?.stats?.totalCourses ?? 0);
  activeCourses = computed(() => this.stats()?.stats?.activeCourses ?? 0);
  totalStudents = computed(() => this.stats()?.stats?.totalStudents ?? 0);
  pendingGrades = computed(() => this.stats()?.stats?.pendingGrades ?? 0);

  ngOnInit(): void {
    console.log('🚀 [TEACHER-DASHBOARD-QUERY] Component initialized');
    console.log('📊 Cache status:', {
      teacherInfo: this.teacherInfoQuery.status(),
      dashboardStats: this.dashboardStatsQuery.status(),
      courses: this.coursesQuery.status(),
    });
  }

  /**
   * Refrescar manualmente las estadísticas
   * TanStack Query solo hará el fetch si los datos están stale
   */
  refreshStats(): void {
    console.log('🔄 [TEACHER-DASHBOARD-QUERY] Refreshing stats');
    this.dashboardStatsQuery.refetch();
  }

  /**
   * Invalidar todo el caché y refetch
   * Útil después de acciones importantes
   */
  invalidateAndRefresh(): void {
    console.log('🔄 [TEACHER-DASHBOARD-QUERY] Invalidating cache and refreshing');
    this.cacheManager.invalidateAll(this.currentUserId());
  }

  /**
   * Ejemplo: Después de actualizar información del docente
   */
  onTeacherInfoUpdated(): void {
    // Invalidar solo el caché de info del docente
    this.cacheManager.invalidateInfo(this.currentUserId());
  }

  /**
   * Ejemplo: Después de calificar estudiantes
   */
  onGradesUpdated(): void {
    // Invalidar las estadísticas porque cambió el número de pendientes
    this.cacheManager.invalidateStats(this.currentUserId());
  }

  navigateToCourse(courseId: string): void {
    this.router.navigate(['/teacher/course', courseId]);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      Activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Finalizado: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      Programado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  getProgressColor(promedio: number): string {
    if (promedio >= 14) return 'bg-green-500';
    if (promedio >= 11) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('es-ES', options);
  }
}