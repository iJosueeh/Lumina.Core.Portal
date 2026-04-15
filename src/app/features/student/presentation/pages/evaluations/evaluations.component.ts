import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluationsService } from '@features/student/domain/services/evaluations.service';
import { GlobalQuizSummary, GlobalEvaluationsStats } from '@features/student/domain/models/global-evaluation.model';

@Component({
  selector: 'app-evaluations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluations.component.html',
  styles: ``
})
export class EvaluationsComponent implements OnInit {
  allEvaluations = signal<GlobalQuizSummary[]>([]);
  stats = signal<GlobalEvaluationsStats>({
    totalPending: 0,
    totalCompleted: 0,
    averageScore: 0,
    urgentCount: 0,
    upcomingCount: 0
  });
  isLoading = signal(true);
  selectedFilter = signal<'all' | 'pending' | 'completed'>('all');
  selectedYear = signal<number>(2026);

  // Computed
  filteredEvaluations = computed(() => {
    const filter = this.selectedFilter();
    const evals = this.allEvaluations();

    switch (filter) {
      case 'pending':
        return evals.filter(e => e.status !== 'completed');
      case 'completed':
        return evals.filter(e => e.status === 'completed');
      default:
        return evals;
    }
  });

  // Agrupar por curso
  evaluationsByCourse = computed(() => {
    const evals = this.filteredEvaluations();
    const grouped = new Map<string, GlobalQuizSummary[]>();

    evals.forEach(evaluation => {
      const courseEvals = grouped.get(evaluation.courseId) || [];
      
      // 🔄 Normalizar bestScore si está en formato antiguo (porcentaje > 20)
      const normalizedEvaluation = { ...evaluation };
      if (normalizedEvaluation.bestScore && normalizedEvaluation.bestScore > 20) {
        normalizedEvaluation.bestScore = (normalizedEvaluation.bestScore / 100) * 20;
        console.warn(`🔄 Normalizando "${normalizedEvaluation.title}": ${evaluation.bestScore} → ${normalizedEvaluation.bestScore.toFixed(1)}`);
      }
      
      courseEvals.push(normalizedEvaluation);
      grouped.set(evaluation.courseId, courseEvals);
    });

    return Array.from(grouped.entries()).map(([courseId, evaluations]) => {
      // Calcular promedio del curso
      const normalizedScores = evaluations
        .filter(e => e.bestScore !== undefined)
        .map(e => e.bestScore || 0); // Ya están normalizadas
      
      const totalCredits = normalizedScores.length > 0
        ? normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length
        : 0;

      return {
        courseId,
        courseName: evaluations[0].courseName,
        courseColor: evaluations[0].courseColor,
        evaluations,
        totalCredits,
        progress: evaluations.filter(e => e.status === 'completed').length / evaluations.length * 100
      };
    });
  });

  // Cursos donde TODAS las evaluaciones están completadas
  completedCourses = computed(() => {
    return this.evaluationsByCourse().filter(course =>
      course.evaluations.length > 0 &&
      course.evaluations.every(e => e.status === 'completed')
    ).length;
  });

  // Total de cursos con al menos una evaluación
  totalCoursesWithEvaluations = computed(() => {
    // Usar allEvaluations para no verse afectado por el filtro seleccionado
    const courseIds = new Set(this.allEvaluations().map(e => e.courseId));
    return courseIds.size;
  });

  constructor(
    private evaluationsService: EvaluationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvaluations();
    this.loadStats();
  }

  loadEvaluations(): void {
    this.evaluationsService.getAllEvaluations().subscribe({
      next: (evaluations) => {
        console.log('✅ Evaluaciones cargadas:', evaluations.length);
        this.allEvaluations.set(evaluations);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading evaluations:', err);
        console.error('   Detalles del error:', {
          status: err.status,
          message: err.message,
          url: err.url
        });
        this.isLoading.set(false);
      }
    });
  }

  loadStats(): void {
    this.evaluationsService.getGlobalStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  setFilter(filter: 'all' | 'pending' | 'completed'): void {
    this.selectedFilter.set(filter);
  }

  navigateToCourse(courseId: string, evaluationId?: string): void {
    const queryParams: any = { tab: 'evaluations' };
    if (evaluationId) {
      queryParams.evaluationId = evaluationId;
    }
    this.router.navigate(['/student/course', courseId], {
      queryParams
    });
  }

  getStatusBadge(status: string): { text: string; class: string } {
    switch (status) {
      case 'urgent':
        return { text: 'En riesgo', class: 'bg-rose-500/15 text-rose-300 border border-rose-400/30' };
      case 'upcoming':
        return { text: 'En curso', class: 'bg-amber-500/15 text-amber-300 border border-amber-400/30' };
      case 'completed':
        return { text: 'Aprobado', class: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' };
      default:
        return { text: 'Disponible', class: 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30' };
    }
  }

  // Umbrales para escala vigesimal peruana (0-20)
  getScoreColor(score: number | undefined): string {
    if (!score) return 'text-gray-400';
    if (score >= 17) return 'text-green-500'; // Excelente: 17-20
    if (score >= 14) return 'text-blue-500';  // Bueno: 14-16.99
    if (score >= 10.5) return 'text-yellow-500'; // Aprobado: 10.5-13.99
    return 'text-red-500'; // Desaprobado: 0-10.49
  }

  getProgressPercentage(used: number, allowed: number): number {
    if (allowed === 0) return 0;
    return Math.min((used / allowed) * 100, 100);
  }
}
