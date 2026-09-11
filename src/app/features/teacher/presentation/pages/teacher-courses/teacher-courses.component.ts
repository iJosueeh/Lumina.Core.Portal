import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { useTeacherCourses } from '@features/teacher/infrastructure/queries/teacher-query-hooks';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

// UI Components
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';
import { StatusBadgeComponent } from '@shared/components/ui/status-badge/status-badge.component';

@Component({
    selector: 'app-teacher-courses',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        PageHeaderComponent,
        StatCardComponent,
        StatusBadgeComponent
    ],
    templateUrl: './teacher-courses.component.html',
})
export class TeacherCoursesComponent {
    private authRepository = inject(AuthRepository);
    private router = inject(Router);

    private currentUserId = computed(() => this.authRepository.getCurrentUser()?.id ?? '');
    coursesQuery = useTeacherCourses(this.currentUserId());

    courses = computed(() => this.coursesQuery.data() || []);
    isLoading = computed(() => this.coursesQuery.isPending());

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

    setFilter(filter: 'Todos' | 'Activos' | 'Archivados'): void {
        this.selectedFilter.set(filter);
    }

    manageCourse(courseId: string): void {
        this.router.navigate(['/teacher/course', courseId]);
    }
}
