import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { GradeStats, CourseGrade, Evaluation } from '@features/student/domain/models/grade.model';
import { GetStudentGradesUseCase } from '@features/student/application/use-cases/get-student-grades.usecase';
import { GetGradeStatsUseCase } from '@features/student/application/use-cases/get-grade-stats.usecase';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { environment } from '@environments/environment';

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
  private http = inject(HttpClient);

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

    // 1. Primero resolver el estudianteId desde el perfil del estudiante
    this.http.get<{ estudianteId: string }>(`${environment.estudiantesApiUrl}/perfil-estudiante/estudiante-id`).pipe(
      switchMap(({ estudianteId }) => {
        console.log('[GRADES] EstudianteId resolved:', estudianteId);

        // 2. Fetch grades and stats in parallel
        return forkJoin({
          grades: this.getStudentGradesUseCase.execute(estudianteId),
          stats: this.getGradeStatsUseCase.execute(estudianteId),
        });
      }),
      catchError((err) => {
        console.error('[GRADES] Error resolving estudianteId or loading data:', err);
        this.errorMessage.set('Error al cargar las calificaciones. Intenta nuevamente.');
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe({
      next: (result) => {
        if (!result) return;
        this.allCourses.set(result.grades);
        this.courses.set(result.grades);
        this.stats.set(result.stats);
        this.isLoading.set(false);
      },
    });
  }

  setSemester(semester: SemesterFilter): void {
    this.activeSemester.set(semester);
  }

  toggleCourse(courseId: string): void {
    this.allCourses.update(courses =>
      courses.map(c => c.id === courseId ? { ...c, isExpanded: !c.isExpanded } : c)
    );
    // Also update courses signal for any direct usage
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

  getCompletadasCount(evaluaciones: Evaluation[] | undefined): number {
    return (evaluaciones ?? []).filter(e => e.estado === 'Completado').length;
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
