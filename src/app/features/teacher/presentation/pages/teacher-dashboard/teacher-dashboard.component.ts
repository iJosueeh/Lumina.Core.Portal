import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GetTeacherCoursesUseCase } from '@features/teacher/application/use-cases/get-teacher-courses.usecase';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

@Component({
    selector: 'app-teacher-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './teacher-dashboard.component.html',
    styles: ``
})
export class TeacherDashboardComponent implements OnInit {
    teacherName = 'Docente';
    courses: TeacherCourse[] = [];
    isLoadingCourses = true;

    // Estadísticas generales
    totalCourses = 0;
    totalStudents = 0;
    pendingGrades = 0;
    upcomingClasses = 0;

    constructor(
        private getCoursesUseCase: GetTeacherCoursesUseCase,
        private authRepository: AuthRepository,
        private router: Router
    ) { }

    ngOnInit(): void {
        const currentUser = this.authRepository.getCurrentUser();
        if (currentUser) {
            this.teacherName = currentUser.fullName.split(' ')[0];
            this.loadDashboardData(currentUser.id);
        }
    }

    loadDashboardData(teacherId: string): void {
        this.getCoursesUseCase.execute(teacherId).subscribe({
            next: (courses) => {
                console.log('✅ [TEACHER-DASHBOARD] Cursos cargados:', courses);
                this.courses = courses;
                this.calculateStats(courses);
                this.isLoadingCourses = false;
            },
            error: (error) => {
                console.error('❌ [TEACHER-DASHBOARD] Error cargando cursos:', error);
                this.isLoadingCourses = false;
            }
        });
    }

    calculateStats(courses: TeacherCourse[]): void {
        this.totalCourses = courses.length;
        this.totalStudents = courses.reduce((sum, course) => sum + course.totalAlumnos, 0);
        // TODO: Implementar lógica para pendingGrades y upcomingClasses cuando estén los endpoints
        this.pendingGrades = 0;
        this.upcomingClasses = 0;
    }

    navigateToCourse(courseId: string): void {
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

    getProgressColor(promedio: number): string {
        if (promedio >= 14) return 'bg-green-500';
        if (promedio >= 11) return 'bg-yellow-500';
        return 'bg-red-500';
    }
}
