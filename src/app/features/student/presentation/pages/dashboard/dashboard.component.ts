import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { GetUpcomingAssignmentsUseCase } from '@features/student/application/use-cases/get-upcoming-assignments.usecase';
import { GetRecentAnnouncementsUseCase } from '@features/student/application/use-cases/get-recent-announcements.usecase';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { Assignment } from '@features/student/domain/models/assignment.model';
import { Announcement } from '@features/student/domain/models/announcement.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styles: ``,
})
export class DashboardComponent implements OnInit {
  userName = 'Estudiante';
  pendingCount = 2;

  courses: CourseProgress[] = [];
  assignments: Assignment[] = [];
  announcements: Announcement[] = [];

  isLoadingCourses = true;
  isLoadingAssignments = true;
  isLoadingAnnouncements = true;

  // View Controls
  assignmentsLimit = 3;
  announcementsLimit = 3;

  toggleAssignmentsView(): void {
    this.assignmentsLimit = this.assignmentsLimit === 3 ? this.assignments.length : 3;
  }

  toggleAnnouncementsView(): void {
    this.announcementsLimit = this.announcementsLimit === 3 ? this.announcements.length : 3;
  }

  constructor(
    private getCoursesUseCase: GetStudentCoursesUseCase,
    private getAssignmentsUseCase: GetUpcomingAssignmentsUseCase,
    private getAnnouncementsUseCase: GetRecentAnnouncementsUseCase,
    private authRepository: AuthRepository,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.fullName.split(' ')[0]; // Solo primer nombre
      this.loadDashboardData(currentUser.id);
    }
  }

  loadDashboardData(studentId: string): void {
    // Cargar cursos
    this.getCoursesUseCase.execute(studentId).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.isLoadingCourses = false;
      },
      error: () => (this.isLoadingCourses = false),
    });

    // Cargar tareas
    this.getAssignmentsUseCase.execute(studentId).subscribe({
      next: (assignments) => {
        this.assignments = assignments;
        this.pendingCount = assignments.length;
        this.isLoadingAssignments = false;
      },
      error: () => (this.isLoadingAssignments = false),
    });

    // Cargar anuncios
    this.getAnnouncementsUseCase.execute(studentId).subscribe({
      next: (announcements) => {
        this.announcements = announcements;
        this.isLoadingAnnouncements = false;
      },
      error: () => (this.isLoadingAnnouncements = false),
    });
  }

  getProgressColor(progreso: number): string {
    if (progreso >= 70) return 'bg-blue-500';
    if (progreso >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getCategoryColor(categoria: string): string {
    const colors: Record<string, string> = {
      PROGRAMACIÓN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      BACKEND: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'BASES DE DATOS': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  viewCourse(courseId: string): void {
    this.router.navigate(['/student/course', courseId]);
  }
}
