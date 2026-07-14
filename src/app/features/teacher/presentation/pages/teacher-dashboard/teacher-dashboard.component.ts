import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { 
  useTeacherInfo, 
  useDashboardStats, 
  useTeacherCourses,
  useInvalidateTeacherCache 
} from '@features/teacher/infrastructure/queries/teacher-query-hooks';

import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '@shared/components/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent
  ],
  templateUrl: './teacher-dashboard.component.html',
})
export class TeacherDashboardComponent {
  private authRepository = inject(AuthRepository);
  private router = inject(Router);
  
  private currentUserId = computed(() => this.authRepository.getCurrentUser()?.id ?? '');
  
  // TanStack Query hooks
  teacherInfoQuery = useTeacherInfo(this.currentUserId());
  dashboardStatsQuery = useDashboardStats(this.currentUserId());
  coursesQuery = useTeacherCourses(this.currentUserId());
  cacheManager = useInvalidateTeacherCache();

  teacherName = computed(() => {
    const data = this.teacherInfoQuery.data();
    return data?.nombre?.split(' ')[0] || 'Docente';
  });

  stats = computed(() => this.dashboardStatsQuery.data());
  courses = computed(() => this.coursesQuery.data() || []);
  totalStudents = computed(() => this.stats()?.stats?.totalStudents || 0);

  isLoading = computed(() => 
    this.teacherInfoQuery.isPending() || 
    this.dashboardStatsQuery.isPending() || 
    this.coursesQuery.isPending()
  );

  isLoadingStats = computed(() => this.dashboardStatsQuery.isPending());
  isLoadingCourses = computed(() => this.coursesQuery.isPending());

  refreshAll(): void {
    this.teacherInfoQuery.refetch();
    this.dashboardStatsQuery.refetch();
    this.coursesQuery.refetch();
  }

  invalidateCache(): void {
    this.cacheManager.invalidateAll(this.currentUserId());
  }

  navigateToCourse(courseId: string): void {
    this.router.navigate(['/teacher/course', courseId]);
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
}
