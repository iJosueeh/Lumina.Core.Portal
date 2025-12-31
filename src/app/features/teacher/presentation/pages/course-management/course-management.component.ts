import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GetTeacherCoursesUseCase } from '@features/teacher/application/use-cases/get-teacher-courses.usecase';
import { GetCourseStatsUseCase } from '@features/teacher/application/use-cases/get-course-stats.usecase';
import { GetCourseGradesUseCase } from '@features/teacher/application/use-cases/get-course-grades.usecase';
import { TeacherCourse, CourseStats } from '@features/teacher/domain/models/teacher-course.model';
import { StudentGrade } from '@features/teacher/domain/models/student-grade.model';

type TabType = 'evaluaciones' | 'estudiantes' | 'materiales' | 'asistencia';

interface EvaluationActivity {
    id: string;
    titulo: string;
    tipo: string;
    fechaLimite: Date;
    ponderacion: number;
    estado: 'Pendiente Calificar' | 'Publicado' | 'Borrador' | 'Calificado';
    estudiantesCompletados: number;
    totalEstudiantes: number;
}

@Component({
    selector: 'app-course-management',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './course-management.component.html',
    styles: ``
})

export class CourseManagementComponent implements OnInit {
    courseId: string = '';
    course: TeacherCourse | null = null;
    stats: CourseStats | null = null;
    students: StudentGrade[] = [];
    
    isLoading = true;
    activeTab: TabType = 'evaluaciones';
    searchTerm = '';
    selectedTypeFilter = 'Todos los tipos';
    selectedStateFilter = 'Todos los estados';

    // Mock data para evaluaciones
    evaluations: EvaluationActivity[] = [
        {
            id: '1',
            titulo: 'Proyecto Final: E-commerce',
            tipo: 'Proyecto',
            fechaLimite: new Date('2024-10-10'),
            ponderacion: 30,
            estado: 'Pendiente Calificar',
            estudiantesCompletados: 24,
            totalEstudiantes: 45
        },
        {
            id: '2',
            titulo: 'Examen Parcial Teórico',
            tipo: 'Examen',
            fechaLimite: new Date('2024-10-15'),
            ponderacion: 20,
            estado: 'Publicado',
            estudiantesCompletados: 0,
            totalEstudiantes: 45
        },
        {
            id: '3',
            titulo: 'Tarea 3: API REST',
            tipo: 'Tarea',
            fechaLimite: new Date('2024-10-01'),
            ponderacion: 10,
            estado: 'Calificado',
            estudiantesCompletados: 42,
            totalEstudiantes: 45
        },
        {
            id: '4',
            titulo: 'Quiz Rápido: React Hooks',
            tipo: 'Quiz',
            fechaLimite: new Date('2024-09-28'),
            ponderacion: 5,
            estado: 'Borrador',
            estudiantesCompletados: 0,
            totalEstudiantes: 45
        }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private getCoursesUseCase: GetTeacherCoursesUseCase,
        private getStatsUseCase: GetCourseStatsUseCase,
        private getGradesUseCase: GetCourseGradesUseCase
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.courseId = params['id'];
            this.loadCourseData();
        });
    }

    loadCourseData(): void {
        // TODO: Implementar obtención de curso por ID
        // Por ahora usamos mock data
        this.isLoading = false;
        
        // Mock course data
        this.course = {
            id: this.courseId,
            codigo: 'CS-101',
            titulo: 'Desarrollo Web Full Stack',
            descripcion: 'Curso completo de desarrollo web',
            creditos: 4,
            ciclo: 'Semestre 2024-1',
            totalAlumnos: 45,
            alumnosActivos: 42,
            promedioGeneral: 16.4,
            asistenciaPromedio: 95,
            estadoCurso: 'Activo',
            horario: []
        };

        this.stats = {
            totalAlumnos: 45,
            alumnosActivos: 42,
            alumnosInactivos: 3,
            promedioGeneral: 16.4,
            aprobados: 38,
            reprobados: 4,
            asistenciaPromedio: 95,
            tareasEntregadas: 120,
            tareasPendientes: 45
        };
    }

    setActiveTab(tab: TabType): void {
        this.activeTab = tab;
    }

    getNextDelivery(): string {
        const nextEval = this.evaluations
            .filter(e => e.fechaLimite > new Date())
            .sort((a, b) => a.fechaLimite.getTime() - b.fechaLimite.getTime())[0];
        
        if (!nextEval) return 'N/A';
        
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return nextEval.fechaLimite.toLocaleDateString('es-ES', options);
    }

    getPendingGradesCount(): number {
        return this.evaluations
            .filter(e => e.estado === 'Pendiente Calificar')
            .reduce((sum, e) => sum + e.estudiantesCompletados, 0);
    }

    getStatusColor(estado: string): string {
        const colors: Record<string, string> = {
            'Pendiente Calificar': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'Publicado': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Calificado': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'Borrador': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        };
        return colors[estado] || 'bg-gray-100 text-gray-700';
    }

    getTypeIcon(tipo: string): string {
        const icons: Record<string, string> = {
            'Proyecto': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
            'Examen': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            'Tarea': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            'Quiz': 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
        return icons[tipo] || icons['Tarea'];
    }

    formatDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    formatTime(date: Date): string {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    viewDetails(evaluationId: string): void {
        console.log('Ver detalles de:', evaluationId);
        // TODO: Navegar a detalles de evaluación
    }

    editEvaluation(evaluationId: string): void {
        console.log('Editar evaluación:', evaluationId);
        // TODO: Implementar edición
    }

    deleteEvaluation(evaluationId: string): void {
        if (confirm('¿Estás seguro de eliminar esta evaluación?')) {
            console.log('Eliminar evaluación:', evaluationId);
            // TODO: Implementar eliminación
        }
    }

    gradeEvaluation(evaluationId: string): void {
        console.log('Calificar evaluación:', evaluationId);
        // TODO: Navegar a página de calificación
    }

    createNewActivity(): void {
        console.log('Crear nueva actividad');
        // TODO: Implementar creación de actividad
    }

    goBack(): void {
        this.router.navigate(['/teacher/courses']);
    }
}
