import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { GetUpcomingAssignmentsUseCase } from '@features/student/application/use-cases/get-upcoming-assignments.usecase';
import { GetRecentAnnouncementsUseCase } from '@features/student/application/use-cases/get-recent-announcements.usecase';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { Assignment } from '@features/student/domain/models/assignment.model';
import { Announcement } from '@features/student/domain/models/announcement.model';
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
export class DashboardComponent implements OnInit {
  private getCoursesUseCase = inject(GetStudentCoursesUseCase);
  private getAssignmentsUseCase = inject(GetUpcomingAssignmentsUseCase);
  private getAnnouncementsUseCase = inject(GetRecentAnnouncementsUseCase);
  private authRepository = inject(AuthRepository);
  public router = inject(Router);
  private cacheService = inject(CacheService);

  userName = signal('Estudiante');
  courses = signal<CourseProgress[]>([]);
  assignments = signal<Assignment[]>([]);
  announcements = signal<Announcement[]>([]);
  
  isLoading = signal(true);
  pendingCount = signal(0);

  ngOnInit(): void {
    const user = this.authRepository.getCurrentUser();
    if (user) {
      this.userName.set(user.fullName.split(' ')[0]);
      this.loadData(user.id);
    }
  }

  loadData(studentId: string): void {
    this.isLoading.set(true);
    this.cacheService.invalidate(`student-courses-${studentId}`);

    this.getCoursesUseCase.execute(studentId).subscribe({
      next: (data) => this.courses.set(data),
      complete: () => this.isLoading.set(false)
    });

    this.getAssignmentsUseCase.execute(studentId).subscribe({
      next: (data) => {
        this.assignments.set(data);
        this.pendingCount.set(data.length);
      }
    });

    this.getAnnouncementsUseCase.execute(studentId).subscribe({
      next: (data) => this.announcements.set(data)
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
