import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GetTeacherCoursesUseCase } from '@features/teacher/application/use-cases/get-teacher-courses.usecase';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

// Atomic UI
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '@shared/components/ui/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
    selector: 'app-teacher-courses',
    standalone: true,
    imports: [
        CommonModule, 
        RouterModule, 
        FormsModule,
        StatCardComponent,
        StatusBadgeComponent,
        SkeletonLoaderComponent
    ],
    templateUrl: './teacher-courses.component.html',
})
export class TeacherCoursesComponent implements OnInit {
    private getCoursesUseCase = inject(GetTeacherCoursesUseCase);
    private authRepository = inject(AuthRepository);
    private router = inject(Router);

    // Signals para el estado
    courses = signal<TeacherCourse[]>([]);
    isLoading = signal(true);
    searchTerm = signal('');
    selectedFilter = signal<'Todos' | 'Activos' | 'Archivados'>('Todos');

    // Lógica de filtrado reactiva con computed
    filteredCourses = computed(() => {
        let list = this.courses();
        const term = this.searchTerm().toLowerCase().trim();
        const filter = this.selectedFilter();

        if (filter === 'Activos') {
            list = list.filter(c => c.estadoCurso === 'Activo');
        } else if (filter === 'Archivados') {
            list = list.filter(c => c.estadoCurso === 'Finalizado');
        }

        if (term) {
            list = list.filter(c => 
                c.titulo.toLowerCase().includes(term) ||
                c.codigo.toLowerCase().includes(term)
            );
        }

        return list;
    });

    // Estadísticas rápidas calculadas
    totalCoursesCount = computed(() => this.courses().length);
    activeCoursesCount = computed(() => this.courses().filter(c => c.estadoCurso === 'Activo').length);
    archivedCoursesCount = computed(() => this.courses().filter(c => c.estadoCurso === 'Finalizado').length);

    ngOnInit(): void {
        const currentUser = this.authRepository.getCurrentUser();
        if (currentUser) {
            this.loadCourses(currentUser.id);
        }
    }

    loadCourses(teacherId: string): void {
        this.isLoading.set(true);
        this.getCoursesUseCase.execute(teacherId).subscribe({
            next: (data) => {
                this.courses.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('❌ [TEACHER-COURSES] Error cargando cursos:', error);
                this.isLoading.set(false);
            }
        });
    }

    setFilter(filter: 'Todos' | 'Activos' | 'Archivados'): void {
        this.selectedFilter.set(filter);
    }

    manageCourse(courseId: string): void {
        this.router.navigate(['/teacher/course', courseId]);
    }
}
