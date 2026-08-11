import { Component, inject, signal, computed } from '@angular/core';
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
export class GradesComponent {
  private getStudentGradesUseCase = inject(GetStudentGradesUseCase);
  private getGradeStatsUseCase = inject(GetGradeStatsUseCase);
  private authRepository = inject(AuthRepository);

  activeSemester = signal<SemesterFilter>('2026');
  isLoading = signal(true);
  errorMessage = signal('');

  filteredCourses = computed(() => {
    const semester = this.activeSemester();
    const all = this.allCourses();
    if (semester === 'all') return all;
    if (semester === '2026') return all.filter(c => c.promedio > 0).slice(0, 3);
    if (semester === '2025') return all.filter(c => c.promedio > 0).slice(3);
    return all;
  });

  hasRealGrades = computed(() => this.allCourses().some(c => c.promedio > 0));

  stats = signal<GradeStats>({
    promedioGeneral: 0,
    creditosAprobados: 0,
    totalCreditos: 0,
    cursosCompletados: 0,
    rankingClase: 'Sin datos',
    percentilRanking: 0,
    ultimaActualizacion: new Date(),
  });

  allCourses = signal<CourseGrade[]>([]);
  courses = signal<CourseGrade[]>([]);

  semesters = [
    { id: '2026' as SemesterFilter, label: '2026' },
    { id: '2025' as SemesterFilter, label: '2025' },
    { id: 'all' as SemesterFilter, label: 'Todos' },
  ];

  totalCredits = computed(() => this.courses().reduce((sum, c) => sum + c.creditos, 0));

  constructor() {
    this.loadGrades();
  }

  loadGrades(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (!currentUser) {
      this.errorMessage.set('No se pudo obtener la información del usuario');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.getStudentGradesUseCase.execute(currentUser.id).subscribe({
      next: (grades) => {
        this.allCourses.set(grades);
        this.courses.set(grades);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando calificaciones:', err);
        this.errorMessage.set('Error al cargar las calificaciones. Intenta nuevamente.');
        this.isLoading.set(false);
      },
    });

    this.getGradeStatsUseCase.execute(currentUser.id).subscribe({
      next: (stats) => this.stats.set(stats),
      error: (err) => console.error('Error cargando estadísticas:', err),
    });
  }

  setSemester(semester: SemesterFilter): void {
    this.activeSemester.set(semester);
  }

  toggleCourse(courseId: string): void {
    this.courses.update(courses =>
      courses.map(c => c.id === courseId ? { ...c, isExpanded: !c.isExpanded } : c)
    );
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      Aprobado: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      'En Curso': 'text-blue-700 bg-blue-50 border-blue-200',
      'En Riesgo': 'text-red-700 bg-red-50 border-red-200',
    };
    return colors[estado] || 'text-slate-700 bg-slate-50 border-slate-200';
  }

  getPromedioColor(promedio: number): string {
    if (promedio >= 17) return 'text-emerald-700 font-bold';
    if (promedio >= 14) return 'text-blue-700 font-bold';
    if (promedio >= 10.5) return 'text-amber-700 font-bold';
    return 'text-red-700 font-bold';
  }

  getEstadoBadge(estado: string): string {
    const badges: Record<string, string> = {
      Completado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      Pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
    };
    return badges[estado] || 'bg-slate-50 text-slate-700 border border-slate-200';
  }

  exportGrades(): void {
    const headers = ['Curso', 'Código', 'Créditos', 'Promedio', 'Estado'];
    const rows = this.courses().map(course => [
      course.nombre,
      course.codigo,
      course.creditos.toString(),
      course.promedio.toFixed(2),
      course.estado,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calificaciones_${this.activeSemester()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printGrades(): void {
    window.print();
  }
}
