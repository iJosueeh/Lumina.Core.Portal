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
      courseEvals.push(evaluation);
      grouped.set(evaluation.courseId, courseEvals);
    });

    return Array.from(grouped.entries()).map(([courseId, evaluations]) => ({
      courseId,
      courseName: evaluations[0].courseName,
      courseColor: evaluations[0].courseColor,
      evaluations,
      totalCredits: evaluations.reduce((sum, e) => sum + (e.bestScore || 0), 0) / evaluations.length,
      progress: evaluations.filter(e => e.status === 'completed').length / evaluations.length * 100
    }));
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
        this.allEvaluations.set(evaluations);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading evaluations:', err);
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

  navigateToCourse(courseId: string): void {
    this.router.navigate(['/student/courses', courseId], {
      queryParams: { tab: 'evaluations' }
    });
  }

  getStatusBadge(status: string): { text: string; class: string } {
    switch (status) {
      case 'urgent':
        return { text: 'En Riesgo', class: 'bg-red-500 text-white' };
      case 'upcoming':
        return { text: 'En Curso', class: 'bg-yellow-500 text-white' };
      case 'completed':
        return { text: 'Aprobado', class: 'bg-green-500 text-white' };
      default:
        return { text: 'Disponible', class: 'bg-blue-500 text-white' };
    }
  }

  getScoreColor(score: number | undefined): string {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }
}
