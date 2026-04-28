import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { CacheService } from '@core/services/cache.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '@shared/components/ui/status-badge/status-badge.component';

type FilterType = 'all' | 'in-progress' | 'completed' | 'semester';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, ButtonComponent, SkeletonLoaderComponent, StatusBadgeComponent],
  templateUrl: './my-courses.component.html',
  styles: ``,
})
export class MyCoursesComponent implements OnInit {
  // Signals para estado reactivo
  allCourses = signal<CourseProgress[]>([]);
  activeFilter = signal<FilterType>('all');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Computed para filtrado eficiente
  filteredCourses = computed(() => {
    const courses = this.allCourses();
    const filter = this.activeFilter();

    if (filter === 'in-progress') return courses.filter(c => c.progreso > 0 && c.progreso < 100);
    if (filter === 'completed') return courses.filter(c => c.progreso === 100);
    return courses;
  });

  filters = [
    { id: 'all' as FilterType, label: 'Todos' },
    { id: 'in-progress' as FilterType, label: 'En Progreso' },
    { id: 'completed' as FilterType, label: 'Completados' },
    { id: 'semester' as FilterType, label: 'Semestre 2026' },
  ];

  constructor(
    private getCoursesUseCase: GetStudentCoursesUseCase,
    private authRepository: AuthRepository,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (!currentUser) {
      this.error.set('Usuario no identificado');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Patrón reactivo: suscripción directa que actualiza el signal
    this.getCoursesUseCase.execute(currentUser.id).subscribe({
      next: (courses) => {
        console.log('📚 Cursos recibidos:', courses);
        this.allCourses.set(courses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error en MyCoursesComponent:', err);
        this.error.set('No se pudieron cargar los cursos. Por favor, reintenta.');
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  getBadgeStatus(progreso: number): 'success' | 'warning' | 'info' | 'default' {
    if (progreso === 100) return 'success';
    if (progreso >= 50) return 'info';
    if (progreso > 0) return 'warning';
    return 'default';
  }

  getProgressBarClass(progreso: number): string {
    if (progreso >= 70) return 'bg-cyan-400';
    if (progreso >= 30) return 'bg-blue-400';
    return 'bg-violet-400';
  }

  viewCourse(courseId: string): void {
    this.router.navigate(['/student/course', courseId]);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop';
  }
}

