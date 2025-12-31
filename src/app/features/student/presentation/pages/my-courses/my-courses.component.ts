import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

type FilterType = 'all' | 'in-progress' | 'completed' | 'semester';

interface CourseWithStatus extends CourseProgress {
    status: 'En Progreso' | 'Activo' | 'Completado' | 'Nuevo' | 'Examen';
    nextModule?: string;
    professor?: string;
    rating?: string;
}

@Component({
    selector: 'app-my-courses',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './my-courses.component.html',
    styles: ``
})
export class MyCoursesComponent implements OnInit {
    activeFilter: FilterType = 'all';
    allCourses: CourseWithStatus[] = [];
    filteredCourses: CourseWithStatus[] = [];
    isLoading = true;

    filters = [
        { id: 'all' as FilterType, label: 'Todos' },
        { id: 'in-progress' as FilterType, label: 'En Progreso' },
        { id: 'completed' as FilterType, label: 'Completados' },
        { id: 'semester' as FilterType, label: 'Semestre 2024-1' }
    ];

    constructor(
        private getCoursesUseCase: GetStudentCoursesUseCase,
        private authRepository: AuthRepository,
        private router: Router
    ) { }

    ngOnInit(): void {
        const currentUser = this.authRepository.getCurrentUser();
        if (currentUser) {
            this.loadCourses(currentUser.id);
        }
    }

    loadCourses(studentId: string): void {
        this.getCoursesUseCase.execute(studentId).subscribe({
            next: (courses) => {
                // Agregar datos adicionales a los cursos
                this.allCourses = courses.map((course, index) => ({
                    ...course,
                    status: this.getStatusForCourse(course.progreso, index),
                    professor: this.getProfessorForCourse(index),
                    nextModule: course.moduloActual,
                    rating: '18/20'
                }));
                this.filteredCourses = this.allCourses;
                this.isLoading = false;
            },
            error: () => this.isLoading = false
        });
    }

    setFilter(filter: FilterType): void {
        this.activeFilter = filter;

        switch (filter) {
            case 'all':
                this.filteredCourses = this.allCourses;
                break;
            case 'in-progress':
                this.filteredCourses = this.allCourses.filter(c => c.progreso > 0 && c.progreso < 100);
                break;
            case 'completed':
                this.filteredCourses = this.allCourses.filter(c => c.progreso === 100);
                break;
            case 'semester':
                this.filteredCourses = this.allCourses; // Filtrar por semestre
                break;
        }
    }

    getStatusForCourse(progreso: number, index: number): 'En Progreso' | 'Activo' | 'Completado' | 'Nuevo' | 'Examen' {
        if (progreso === 100) return 'Completado';
        if (progreso === 0) return 'Nuevo';
        if (index === 1) return 'Activo';
        if (index === 5) return 'Examen';
        return 'En Progreso';
    }

    getProfessorForCourse(index: number): string {
        const professors = [
            'Prof. Carlos Mendoza',
            'Prof. Ana García',
            'Prof. Sofía Martínez',
            'Prof. Jorge Ruiz',
            'Prof. María López',
            'Prof. Roberto Díaz'
        ];
        return professors[index] || 'Prof. Asignado';
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'En Progreso': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Activo': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'Completado': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
            'Nuevo': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'Examen': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    }

    getProgressColor(progreso: number): string {
        if (progreso === 100) return 'bg-green-500';
        if (progreso >= 70) return 'bg-blue-500';
        if (progreso >= 30) return 'bg-yellow-500';
        return 'bg-gray-400';
    }

    getButtonText(status: string, progreso: number): string {
        if (progreso === 100) return 'Ver Certificado';
        return 'Continuar Aprendizaje';
    }

    viewCourse(courseId: string): void {
        this.router.navigate(['/student/course', courseId]);
    }
}
