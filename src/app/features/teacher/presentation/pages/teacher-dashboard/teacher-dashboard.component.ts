import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { 
  useTeacherInfo, 
  useDashboardStats, 
  useTeacherCourses,
  useTeacherStudents,
  useInvalidateTeacherCache 
} from '@features/teacher/infrastructure/queries/teacher-query-hooks';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-dashboard.component.html',
})
export class TeacherDashboardComponent {
  private authRepository = inject(AuthRepository);
  private router = inject(Router);
  
  // ID del usuario actual
  private currentUserId = computed(() => this.authRepository.getCurrentUser()?.id ?? '');
  
  // TanStack Query hooks (caché automático)
  teacherInfoQuery = useTeacherInfo(this.currentUserId());
  dashboardStatsQuery = useDashboardStats(this.currentUserId());
  coursesQuery = useTeacherCourses(this.currentUserId());
  // OPTIMIZACIÓN: No cargar estudiantes en dashboard (enabled: false) - solo en students-list
  studentsQuery = useTeacherStudents(this.currentUserId(), { enabled: false });
  cacheManager = useInvalidateTeacherCache();

  // Computed signals para acceso fácil a los datos
  teacherName = computed(() => {
    const data = this.teacherInfoQuery.data();
    return data?.nombre?.split(' ')[0] || 'Docente';
  });

  stats = computed(() => this.dashboardStatsQuery.data());
  courses = computed(() => this.coursesQuery.data() || []);
  students = computed(() => this.studentsQuery.data() || []);
  // OPTIMIZACIÓN: Usar totalStudents del stats (viene del backend) en lugar de contar el array
  totalStudents = computed(() => this.stats()?.stats?.totalStudents || 0);

  // Alias para compatibilidad con el template
  dashboardStats = this.stats;
  
  // Estados de loading individuales (para el template)
  isLoadingStats = computed(() => this.dashboardStatsQuery.isPending());
  isLoadingCourses = computed(() => this.coursesQuery.isPending());

  // Estados de loading (combinados para simplicidad)
  isLoading = computed(() => 
    this.teacherInfoQuery.isPending() || 
    this.dashboardStatsQuery.isPending() || 
    this.coursesQuery.isPending()
  );

  hasError = computed(() => 
    this.teacherInfoQuery.isError() || 
    this.dashboardStatsQuery.isError() ||
    this.coursesQuery.isError()
  );

  // Refrescar estadísticas manualmente
  refreshStats(): void {
    this.dashboardStatsQuery.refetch();
  }

  // Invalidar todo el caché del docente
  invalidateCache(): void {
    this.cacheManager.invalidateAll(this.currentUserId());
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

  // Métodos de utilidad para el template
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

