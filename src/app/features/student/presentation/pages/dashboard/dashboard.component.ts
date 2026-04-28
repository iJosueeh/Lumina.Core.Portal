import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, catchError, finalize } from 'rxjs';

// Models
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { Assignment } from '@features/student/domain/models/assignment.model';
import { Announcement } from '@features/student/domain/models/announcement.model';

// Use Cases
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { GetUpcomingAssignmentsUseCase } from '@features/student/application/use-cases/get-upcoming-assignments.usecase';
import { GetRecentAnnouncementsUseCase } from '@features/student/application/use-cases/get-recent-announcements.usecase';

// Services
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { CacheService } from '@core/services/cache.service';

// Sub-components
import { WelcomeHeaderComponent } from './welcome-header/welcome-header.component';
import { StudentStatsComponent } from './student-stats/student-stats.component';
import { ActiveCoursesGridComponent } from './active-courses-grid/active-courses-grid.component';
import { UpcomingAssignmentsComponent } from './upcoming-assignments/upcoming-assignments.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, WelcomeHeaderComponent, 
    StudentStatsComponent, ActiveCoursesGridComponent, UpcomingAssignmentsComponent
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

  // Signals de Estado
  userName = signal('Estudiante');
  courses = signal<CourseProgress[]>([]);
  assignments = signal<Assignment[]>([]);
  announcements = signal<Announcement[]>([]);
  isLoading = signal(true);
  
  pendingCount = computed(() => this.assignments().length);

  constructor() {
    // Reactividad basada en el usuario actual
    effect(() => {
      const user = this.authRepository.getCurrentUser();
      if (user) {
        this.userName.set(user.fullName.split(' ')[0]);
        this.loadData(user.id);
      }
    });
  }

  loadData(studentId: string): void {
    this.cacheService.invalidate(`student-courses-${studentId}`);
    this.isLoading.set(true);

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
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ courses, assignments, announcements }) => {
        this.courses.set(courses);
        this.assignments.set(assignments);
        this.announcements.set(announcements);
      });
  }

  handleRefresh(): void {
    const user = this.authRepository.getCurrentUser();
    if (user) {
      this.cacheService.clear();
      this.loadData(user.id);
    }
  }

  navigateToCourse(id: string): void {
    this.router.navigate(['/student/course', id]);
  }
}
