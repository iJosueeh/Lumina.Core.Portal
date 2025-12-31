import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GetTeacherCoursesUseCase } from '@features/teacher/application/use-cases/get-teacher-courses.usecase';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

@Component({
    selector: 'app-teacher-courses',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './teacher-courses.component.html',
    styles: ``
})
export class TeacherCoursesComponent implements OnInit {
    courses: TeacherCourse[] = [];
    filteredCourses: TeacherCourse[] = [];
    isLoading = true;
    searchTerm = '';
    selectedFilter: 'Todos' | 'Activos' | 'Archivados' = 'Todos';

    constructor(
        private getCoursesUseCase: GetTeacherCoursesUseCase,
        private authRepository: AuthRepository,
        private router: Router
    ) { }

    ngOnInit(): void {
        const currentUser = this.authRepository.getCurrentUser();
        if (currentUser) {
            this.loadCourses(currentUser.id);
        }
    }

    loadCourses(teacherId: string): void {
        this.getCoursesUseCase.execute(teacherId).subscribe({
            next: (courses) => {
                console.log('✅ [TEACHER-COURSES] Cursos cargados:', courses);
                this.courses = courses;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('❌ [TEACHER-COURSES] Error cargando cursos:', error);
                this.isLoading = false;
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.courses];

        // Filtrar por estado
        if (this.selectedFilter === 'Activos') {
            filtered = filtered.filter(c => c.estadoCurso === 'Activo');
        } else if (this.selectedFilter === 'Archivados') {
            filtered = filtered.filter(c => c.estadoCurso === 'Finalizado');
        }

        // Filtrar por búsqueda
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(c => 
                c.titulo.toLowerCase().includes(term) ||
                c.codigo.toLowerCase().includes(term)
            );
        }

        this.filteredCourses = filtered;
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    setFilter(filter: 'Todos' | 'Activos' | 'Archivados'): void {
        this.selectedFilter = filter;
        this.applyFilters();
    }

    manageCourse(courseId: string): void {
        this.router.navigate(['/teacher/course', courseId]);
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'Activo': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'Finalizado': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
            'Programado': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    }

    getStudentAvatars(totalAlumnos: number): string[] {
        // Generar avatares de ejemplo (máximo 4)
        const count = Math.min(totalAlumnos, 4);
        return Array(count).fill('').map((_, i) => `https://i.pravatar.cc/150?img=${i + 1}`);
    }

    createNewCourse(): void {
        // TODO: Implementar creación de curso
        alert('Funcionalidad de crear curso próximamente');
    }
}
