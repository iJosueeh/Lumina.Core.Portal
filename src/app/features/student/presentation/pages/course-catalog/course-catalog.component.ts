import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EnrollmentService } from '@features/student/infrastructure/services/enrollment.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-course-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-catalog.component.html',
  styleUrl: './course-catalog.component.css'
})
export class CourseCatalogComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(true);
  courses = signal<any[]>([]);
  enrolledIds = signal<Set<string>>(new Set());
  searchTerm = signal('');
  selectedCategory = signal('Todos');
  categories = signal<string[]>(['Todos']);

  filteredCourses = computed(() => {
    let result = this.courses();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter(c =>
        (c.titulo || c.Titulo || '').toLowerCase().includes(term) ||
        (c.codigo || c.Codigo || '').toLowerCase().includes(term)
      );
    }
    const cat = this.selectedCategory();
    if (cat !== 'Todos') {
      result = result.filter(c => (c.categoria || c.Categoria) === cat);
    }
    return result;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    const studentId = this.authService.getUserId() || '';

    this.enrollmentService.getAllCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        // Extract unique categories
        const cats = new Set(courses.map((c: any) => c.categoria || c.Categoria).filter(Boolean));
        this.categories.set(['Todos', ...Array.from(cats)]);

        // Load enrolled status
        if (studentId) {
          this.enrollmentService.getEnrolledCourses(studentId).subscribe({
            next: (enrolled) => {
              const ids = new Set(enrolled.map((e: any) => {
                const id = e.id?.value || e.id || e.Id || e.courseId;
                return String(id).toLowerCase();
              }));
              this.enrolledIds.set(ids);
              this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  isEnrolled(courseId: string): boolean {
    return this.enrolledIds().has(String(courseId).toLowerCase());
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  viewCourse(courseId: string): void {
    this.router.navigate(['/student/course', courseId]);
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }
}
