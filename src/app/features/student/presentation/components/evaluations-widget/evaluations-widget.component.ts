import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluationsService } from '@features/student/domain/services/evaluations.service';
import { GlobalQuizSummary, GlobalEvaluationsStats } from '@features/student/domain/models/global-evaluation.model';
import {
  getStatusColorClasses,
  getDifficultyClasses,
  getDifficultyLabel,
  EvaluationStatus,
  EvaluationDifficulty,
} from '@features/student/domain/utils/evaluation-utils';

@Component({
  selector: 'app-evaluations-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluations-widget.component.html',
  styles: ``
})
export class EvaluationsWidgetComponent implements OnInit {
  upcomingEvaluations = signal<GlobalQuizSummary[]>([]);
  stats = signal<GlobalEvaluationsStats>({
    totalPending: 0,
    totalCompleted: 0,
    averageScore: 0,
    urgentCount: 0,
    upcomingCount: 0
  });
  isLoading = signal(true);
  showAll = signal(false);

  constructor(
    private evaluationsService: EvaluationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvaluations();
    this.loadStats();
  }

  loadEvaluations(): void {
    this.evaluationsService.getUpcomingEvaluations(10).subscribe({
      next: (evaluations) => {
        this.upcomingEvaluations.set(evaluations);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadStats(): void {
    this.evaluationsService.getGlobalStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: () => {}
    });
  }

  getDisplayedEvaluations(): GlobalQuizSummary[] {
    const evals = this.upcomingEvaluations();
    return this.showAll() ? evals : evals.slice(0, 3);
  }

  toggleView(): void {
    this.showAll.set(!this.showAll());
  }

  navigateToCourse(courseId: string): void {
    this.router.navigate(['/student/courses', courseId], {
      queryParams: { tab: 'evaluations' }
    });
  }

  /** Emoji icon per status — kept inline, not worth abstracting. */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'urgent': return '🔴';
      case 'upcoming': return '🟡';
      case 'available': return '🟢';
      case 'completed': return '✅';
      default: return '📋';
    }
  }

  getStatusText(status: string, timeRemaining?: string): string {
    switch (status) {
      case 'urgent': return `Vence en ${timeRemaining}`;
      case 'upcoming': return `Vence en ${timeRemaining}`;
      case 'available': return 'Disponible';
      case 'completed': return 'Completada';
      default: return '';
    }
  }

  getStatusColor(status: string): string {
    return getStatusColorClasses(status as EvaluationStatus);
  }

  getDifficultyBadge(difficulty: string): string {
    return getDifficultyClasses(difficulty as EvaluationDifficulty);
  }

  getDifficultyLabel(difficulty: string): string {
    return getDifficultyLabel(difficulty as EvaluationDifficulty);
  }
}
