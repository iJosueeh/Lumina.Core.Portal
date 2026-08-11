import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, catchError, finalize } from 'rxjs';

// Models
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { Assignment } from '@features/student/domain/models/assignment.model';
import { Announcement } from '@features/student/domain/models/announcement.model';
import { CursoConHorarios } from '@features/student/domain/models/horario.model';

// Use Cases
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { GetUpcomingAssignmentsUseCase } from '@features/student/application/use-cases/get-upcoming-assignments.usecase';
import { GetRecentAnnouncementsUseCase } from '@features/student/application/use-cases/get-recent-announcements.usecase';

// Services
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { CacheService } from '@core/services/cache.service';
import { CoursesService } from '@features/student/infrastructure/services/courses.service';
import { EnrollmentService } from '@features/student/infrastructure/services/enrollment.service';
import { StudentStatsService, StudentDashboardStats } from '@features/student/infrastructure/services/student-stats.service';

// Sub-components
import { WelcomeHeaderComponent } from './welcome-header/welcome-header.component';
import { StudentStatsComponent } from './student-stats/student-stats.component';
import { ActiveCoursesGridComponent } from './active-courses-grid/active-courses-grid.component';
import { UpcomingAssignmentsComponent } from './upcoming-assignments/upcoming-assignments.component';
import { RecentAnnouncementsComponent } from './recent-announcements/recent-announcements.component';
import { TodayClassesComponent } from './today-classes/today-classes.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, WelcomeHeaderComponent, 
    StudentStatsComponent, ActiveCoursesGridComponent, UpcomingAssignmentsComponent,
    RecentAnnouncementsComponent, TodayClassesComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private getCoursesUseCase = inject(GetStudentCoursesUseCase);
  private getAssignmentsUseCase = inject(GetUpcomingAssignmentsUseCase);
  private getAnnouncementsUseCase = inject(GetRecentAnnouncementsUseCase);
  private authRepository = inject(AuthRepository);
  public router = inject(Router);
  private cacheService = inject(CacheService);
  private coursesService = inject(CoursesService);
  private enrollmentService = inject(EnrollmentService);
  private studentStatsService = inject(StudentStatsService);

  // Signals de Estado
  userName = signal('Estudiante');
  courses = signal<CourseProgress[]>([]);
  assignments = signal<Assignment[]>([]);
  announcements = signal<Announcement[]>([]);
  todayCourses = signal<CursoConHorarios[]>([]);
  isLoading = signal(true);

  // Stats reales del backend
  stats = signal<StudentDashboardStats | null>(null);
  promedioGeneral = computed(() => this.stats()?.promedioGeneral ?? 0);
  asistenciaTotal = computed(() => this.stats()?.asistenciaTotal ?? 0);

  pendingCount = computed(() => this.assignments().length);

  constructor() {
    // Reactividad basada en el usuario actual
    effect(() => {
      const user = this.authRepository.getCurrentUser();
      if (user) {
        this.userName.set(user.fullName.split(' ')[0]);
        // Limpiar cache para forzar consulta fresca a la API
        this.enrollmentService.clearStudentIdCache();
        // Resolver studentId desde userId
        this.enrollmentService.getStudentIdByUserId(user.id).subscribe(studentId => {
          if (studentId) {
            this.loadData(studentId);
          }
        });
      }
    });
  }

  loadData(studentId: string): void {
    this.cacheService.invalidate(`student-courses-${studentId}`);
    this.isLoading.set(true);

    // Fetch courses with horarios from Cursos API
    this.coursesService.getAllCoursesWithSchedules().pipe(
      catchError((error) => {
        console.error('❌ [DASHBOARD] Error cargando cursos con horarios:', error);
        return of([] as CursoConHorarios[]);
      })
    ).subscribe((coursesWithSchedules) => {
      this.todayCourses.set(coursesWithSchedules);
    });

    forkJoin({
      courses: this.getCoursesUseCase.execute(studentId).pipe(
        catchError((error) => {
          console.error('❌ [DASHBOARD] Error cargando cursos:', error);
          return of([] as CourseProgress[]);
        })
      ),
      assignments: this.getAssignmentsUseCase.execute(studentId).pipe(
        catchError((error) => {
          console.error('❌ [DASHBOARD] Error cargando tareas:', error);
          return of([] as Assignment[]);
        })
      ),
      announcements: this.getAnnouncementsUseCase.execute(studentId).pipe(
        catchError((error) => {
          console.error('❌ [DASHBOARD] Error cargando anuncios:', error);
          return of([] as Announcement[]);
        })
      ),
      stats: this.studentStatsService.getDashboardStats(studentId).pipe(
        catchError(() => of<StudentDashboardStats>({
          cursosActivos: 0, evaluacionesPendientes: 0, promedioGeneral: 0,
          horasEstudio: 0, cursosCompletados: 0, horasEstudioSemana: 0, asistenciaTotal: 0
        }))
      ),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ courses, assignments, announcements, stats }) => {
        this.courses.set(courses);
        this.assignments.set(assignments);
        this.announcements.set(announcements);
        this.stats.set(stats);
      });
  }

  handleRefresh(): void {
    const user = this.authRepository.getCurrentUser();
    if (user) {
      this.cacheService.clear();
      this.enrollmentService.getStudentIdByUserId(user.id).subscribe(studentId => {
        if (studentId) {
          this.loadData(studentId);
        }
      });
    }
  }

  navigateToCourse(id: string): void {
    this.router.navigate(['/student/course', id]);
  }
}
