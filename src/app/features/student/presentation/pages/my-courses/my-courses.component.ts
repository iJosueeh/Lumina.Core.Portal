import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

type FilterType = 'all' | 'in-progress' | 'completed';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-courses.component.html',
  styles: ``,
})
export class MyCoursesComponent implements OnInit {
  private getCoursesUseCase = inject(GetStudentCoursesUseCase);
  private authRepository = inject(AuthRepository);
  private router = inject(Router);

  allCourses = signal<CourseProgress[]>([]);
  activeFilter = signal<FilterType>('all');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

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
  ];

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

    this.getCoursesUseCase.execute(currentUser.id).subscribe({
      next: (courses) => {
        this.allCourses.set(courses);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los cursos. Por favor, reintenta.');
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  viewCourse(courseId: string): void {
    this.router.navigate(['/student/course', courseId]);
  }
}
