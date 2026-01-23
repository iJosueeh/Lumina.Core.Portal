import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GetTeacherCoursesUseCase } from '@features/teacher/application/use-cases/get-teacher-courses.usecase';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { TeacherDashboardStats } from '@features/teacher/domain/models/teacher-dashboard-stats.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-dashboard.component.html',
  styles: ``,
})
export class TeacherDashboardComponent implements OnInit {
  teacherName = signal('Docente');
  courses = signal<TeacherCourse[]>([]);
  dashboardStats = signal<TeacherDashboardStats | null>(null);
  isLoadingCourses = signal(true);
  isLoadingStats = signal(true);

  // Estadísticas generales
  totalCourses = signal(0);
  totalStudents = signal(0);
  pendingGrades = signal(0);
  upcomingClasses = signal(0);

  constructor(
    private getCoursesUseCase: GetTeacherCoursesUseCase,
    private authRepository: AuthRepository,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (currentUser) {
      this.teacherName.set(currentUser.fullName.split(' ')[0]);
      this.loadDashboardData(currentUser.id);
    }
  }

  loadDashboardData(teacherId: string): void {
    // Cargar cursos
    this.getCoursesUseCase.execute(teacherId).subscribe({
      next: (courses) => {
        console.log('✅ [TEACHER-DASHBOARD] Cursos cargados:', courses);
        this.courses.set(courses);
        this.calculateStats(courses);
        this.isLoadingCourses.set(false);
      },
      error: (error) => {
        console.error('❌ [TEACHER-DASHBOARD] Error cargando cursos:', error);
        this.isLoadingCourses.set(false);
      },
    });

    // Cargar estadísticas del dashboard
    this.http
      .get<TeacherDashboardStats>('/assets/mock-data/teachers/teacher-dashboard-stats.json')
      .subscribe({
        next: (stats) => {
          console.log('✅ [TEACHER-DASHBOARD] Estadísticas cargadas:', stats);
          this.dashboardStats.set(stats);
          this.isLoadingStats.set(false);
        },
        error: (error) => {
          console.error('❌ [TEACHER-DASHBOARD] Error cargando estadísticas:', error);
          this.isLoadingStats.set(false);
        },
      });
  }

  calculateStats(courses: TeacherCourse[]): void {
    this.totalCourses.set(courses.length);
    this.totalStudents.set(courses.reduce((sum, course) => sum + course.totalAlumnos, 0));
    // TODO: Implementar lógica para pendingGrades y upcomingClasses cuando estén los endpoints
    this.pendingGrades.set(0);
    this.upcomingClasses.set(0);
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

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      grade: 'clipboard-check',
      assignment: 'document-plus',
      announcement: 'megaphone',
      attendance: 'user-check',
    };
    return icons[type] || 'bell';
  }
}

