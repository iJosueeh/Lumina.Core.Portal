import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradeStats, CourseGrade } from '@features/student/domain/models/grade.model';
import { GetStudentGradesUseCase } from '@features/student/application/use-cases/get-student-grades.usecase';
import { GetGradeStatsUseCase } from '@features/student/application/use-cases/get-grade-stats.usecase';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

type SemesterFilter = '2026' | '2025' | 'all';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.component.html',
  styles: ``,
})
export class GradesComponent implements OnInit {
  activeSemester: SemesterFilter = '2026';
  isLoading = true;
  errorMessage = '';

  semesters = [
    { id: '2026' as SemesterFilter, label: '2026' },
    { id: '2025' as SemesterFilter, label: '2025' },
    { id: 'all' as SemesterFilter, label: 'Todos' },
  ];

  stats: GradeStats = {
    promedioGeneral: 0,
    creditosAprobados: 0,
    totalCreditos: 0,
    cursosCompletados: 0,
    rankingClase: 'Cargando...',
    percentilRanking: 0,
    ultimaActualizacion: new Date(),
  };

  courses: CourseGrade[] = [];
  allCourses: CourseGrade[] = [];

  constructor(
    private getStudentGradesUseCase: GetStudentGradesUseCase,
    private getGradeStatsUseCase: GetGradeStatsUseCase,
    private authRepository: AuthRepository,
  ) {}

  ngOnInit(): void {
    this.loadGrades();
  }

  private loadGrades(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'No se pudo obtener la información del usuario';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Cargar calificaciones
    this.getStudentGradesUseCase.execute(currentUser.id).subscribe({
      next: (grades) => {
        console.log('✅ Calificaciones cargadas:', grades);
        this.allCourses = grades;
        this.courses = grades;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando calificaciones:', err);
        this.errorMessage = 'Error al cargar las calificaciones. Intenta nuevamente.';
        this.isLoading = false;
      },
    });

    // Cargar estadísticas
    this.getGradeStatsUseCase.execute(currentUser.id).subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('❌ Error cargando estadísticas:', err);
      },
    });
  }

  setSemester(semester: SemesterFilter): void {
    this.activeSemester = semester;

    if (semester === 'all') {
      this.courses = this.allCourses;
    } else {
      // Filtrar cursos por semestre
      this.courses = this.allCourses.filter((course) => {
        // Asumir que los cursos tienen una propiedad semester o usar lógica de fecha
        // Por ahora, filtrar por los primeros cursos para cada semestre
        const index = this.allCourses.indexOf(course);
        if (semester === '2026') return index < 3;
        if (semester === '2025') return index >= 3 && index < 5;
        return true;
      });
    }
  }

  toggleCourse(course: CourseGrade): void {
    course.isExpanded = !course.isExpanded;
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      Aprobado: 'text-green-600 dark:text-green-400',
      'En Curso': 'text-blue-600 dark:text-blue-400',
      'En Riesgo': 'text-red-600 dark:text-red-400',
    };
    return colors[estado] || 'text-gray-600';
  }

  getEstadoBadge(estado: string): string {
    const badges: Record<string, string> = {
      Completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pendiente: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return badges[estado] || 'bg-gray-100 text-gray-700';
  }

  getPromedioColor(promedio: number): string {
    if (promedio >= 17) return 'text-green-600 dark:text-green-400 font-bold';
    if (promedio >= 14) return 'text-blue-600 dark:text-blue-400 font-bold';
    if (promedio >= 11) return 'text-yellow-600 dark:text-yellow-400 font-bold';
    return 'text-red-600 dark:text-red-400 font-bold';
  }

  exportGrades(): void {
    // Crear CSV con las calificaciones
    const headers = ['Curso', 'Código', 'Créditos', 'Promedio', 'Estado'];
    const rows = this.courses.map(course => [
      course.nombre,
      course.codigo,
      course.creditos.toString(),
      course.promedio.toFixed(2),
      course.estado
    ]);

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calificaciones_${this.activeSemester}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printGrades(): void {
    // Abrir diálogo de impresión del navegador
    window.print();
  }
}
