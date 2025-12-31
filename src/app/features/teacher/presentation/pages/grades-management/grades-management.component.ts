import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetTeacherCoursesUseCase } from '@features/teacher/application/use-cases/get-teacher-courses.usecase';
import { GetCourseGradesUseCase } from '@features/teacher/application/use-cases/get-course-grades.usecase';
import { SubmitGradeUseCase } from '@features/teacher/application/use-cases/submit-grade.usecase';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { StudentGrade, EvaluationGrade } from '@features/teacher/domain/models/student-grade.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

interface StudentGradeRow {
    estudianteId: string;
    nombreCompleto: string;
    codigo: string;
    foto: string;
    evaluaciones: { [key: string]: number | null };
    promedioFinal: number;
    progreso: number;
    estado: 'Aprobado' | 'En Riesgo' | 'Reprobado';
    cambiosPendientes: boolean;
}

@Component({
    selector: 'app-grades-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './grades-management.component.html',
    styles: ``
})
export class GradesManagementComponent implements OnInit {
    protected readonly Math = Math;
    courses: TeacherCourse[] = [];
    selectedCourseId: string = '';
    selectedCourse: TeacherCourse | null = null;
    
    students: StudentGradeRow[] = [];
    evaluationColumns: { id: string; nombre: string; peso: number }[] = [];
    
    isLoading = true;
    searchTerm = '';
    hasUnsavedChanges = false;
    
    // Paginación
    currentPage = 1;
    pageSize = 10;
    totalStudents = 0;

    constructor(
        private getCoursesUseCase: GetTeacherCoursesUseCase,
        private getGradesUseCase: GetCourseGradesUseCase,
        private submitGradeUseCase: SubmitGradeUseCase,
        private authRepository: AuthRepository
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
                this.courses = courses;
                if (courses.length > 0) {
                    this.selectedCourseId = courses[0].id;
                    this.onCourseChange();
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error cargando cursos:', error);
                this.isLoading = false;
            }
        });
    }

    onCourseChange(): void {
        this.selectedCourse = this.courses.find(c => c.id === this.selectedCourseId) || null;
        if (this.selectedCourseId) {
            this.loadGrades(this.selectedCourseId);
        }
    }

    loadGrades(courseId: string): void {
        this.isLoading = true;
        
        // Mock data - reemplazar con llamada real al backend
        this.evaluationColumns = [
            { id: 'tarea1', nombre: 'TAREA 1', peso: 15 },
            { id: 'tarea2', nombre: 'TAREA 2', peso: 15 },
            { id: 'quiz1', nombre: 'QUIZ 1', peso: 15 },
            { id: 'parcial', nombre: 'PARCIAL', peso: 25 },
            { id: 'proyecto', nombre: 'PROYECTO', peso: 30 }
        ];

        this.students = [
            {
                estudianteId: '1',
                nombreCompleto: 'Ana García',
                codigo: '20201505',
                foto: 'https://i.pravatar.cc/150?img=1',
                evaluaciones: { tarea1: 18, tarea2: 17, quiz1: 19, parcial: 16, proyecto: 18 },
                promedioFinal: 17.5,
                progreso: 90,
                estado: 'Aprobado',
                cambiosPendientes: false
            },
            {
                estudianteId: '2',
                nombreCompleto: 'Carlos Mendoza',
                codigo: '20193002',
                foto: 'https://i.pravatar.cc/150?img=2',
                evaluaciones: { tarea1: 14, tarea2: 12, quiz1: 10, parcial: 11, proyecto: null },
                promedioFinal: 12.3,
                progreso: 60,
                estado: 'En Riesgo',
                cambiosPendientes: false
            },
            {
                estudianteId: '3',
                nombreCompleto: 'Elena Torres',
                codigo: '20202001',
                foto: 'https://i.pravatar.cc/150?img=3',
                evaluaciones: { tarea1: 20, tarea2: 19, quiz1: 20, parcial: 18, proyecto: 19 },
                promedioFinal: 19.1,
                progreso: 95,
                estado: 'Aprobado',
                cambiosPendientes: false
            },
            {
                estudianteId: '4',
                nombreCompleto: 'Marcos Ruiz',
                codigo: '20194501',
                foto: 'https://i.pravatar.cc/150?img=4',
                evaluaciones: { tarea1: 8, tarea2: 10, quiz1: 9, parcial: 10, proyecto: 11 },
                promedioFinal: 9.8,
                progreso: 45,
                estado: 'Reprobado',
                cambiosPendientes: false
            }
        ];

        this.totalStudents = this.students.length;
        this.isLoading = false;
    }

    onGradeChange(studentId: string, evaluationId: string): void {
        const student = this.students.find(s => s.estudianteId === studentId);
        if (student) {
            student.cambiosPendientes = true;
            this.hasUnsavedChanges = true;
            this.calculateStudentAverage(student);
        }
    }

    calculateStudentAverage(student: StudentGradeRow): void {
        let totalWeighted = 0;
        let totalWeight = 0;

        this.evaluationColumns.forEach(col => {
            const grade = student.evaluaciones[col.id];
            if (grade !== null && grade !== undefined) {
                totalWeighted += grade * (col.peso / 100);
                totalWeight += col.peso / 100;
            }
        });

        student.promedioFinal = totalWeight > 0 ? totalWeighted / totalWeight : 0;
        student.progreso = Math.round((totalWeight * 100));
        
        if (student.promedioFinal >= 14) {
            student.estado = 'Aprobado';
        } else if (student.promedioFinal >= 10.5) {
            student.estado = 'En Riesgo';
        } else {
            student.estado = 'Reprobado';
        }
    }

    saveChanges(): void {
        if (!this.hasUnsavedChanges) return;

        const changedStudents = this.students.filter(s => s.cambiosPendientes);
        console.log('Guardando cambios para:', changedStudents);

        // TODO: Implementar guardado en backend
        // Por ahora solo simulamos el guardado
        changedStudents.forEach(student => {
            student.cambiosPendientes = false;
        });

        this.hasUnsavedChanges = false;
        alert('Cambios guardados exitosamente');
    }

    exportToCSV(): void {
        console.log('Exportando a CSV...');
        // TODO: Implementar exportación a CSV
        alert('Exportación a CSV - Próximamente');
    }

    getEstadoColor(estado: string): string {
        const colors: Record<string, string> = {
            'Aprobado': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'En Riesgo': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'Reprobado': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        return colors[estado] || 'bg-gray-100 text-gray-700';
    }

    getGradeColor(grade: number | null): string {
        if (grade === null || grade === undefined) return 'text-gray-400';
        if (grade >= 14) return 'text-green-600 dark:text-green-400 font-semibold';
        if (grade >= 10.5) return 'text-yellow-600 dark:text-yellow-400 font-semibold';
        return 'text-red-600 dark:text-red-400 font-semibold';
    }

    get filteredStudents(): StudentGradeRow[] {
        if (!this.searchTerm.trim()) {
            return this.students;
        }
        
        const term = this.searchTerm.toLowerCase();
        return this.students.filter(s => 
            s.nombreCompleto.toLowerCase().includes(term) ||
            s.codigo.toLowerCase().includes(term)
        );
    }

    get paginatedStudents(): StudentGradeRow[] {
        const filtered = this.filteredStudents;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return filtered.slice(start, end);
    }

    get totalPages(): number {
        return Math.ceil(this.filteredStudents.length / this.pageSize);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }
}
