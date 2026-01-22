import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluationsService } from '@features/student/domain/services/evaluations.service';
import { GlobalQuizSummary, GlobalEvaluationsStats } from '@features/student/domain/models/global-evaluation.model';

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
    switch (status) {
      case 'urgent': return 'text-red-500 bg-red-500/10';
      case 'upcoming': return 'text-yellow-500 bg-yellow-500/10';
      case 'available': return 'text-green-500 bg-green-500/10';
      case 'completed': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  }

  getDifficultyBadge(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }
}
