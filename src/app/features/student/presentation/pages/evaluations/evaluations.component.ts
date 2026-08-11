import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluationsService } from '@features/student/domain/services/evaluations.service';
import { GlobalQuizSummary } from '@features/student/domain/models/global-evaluation.model';
import {
  getStatusBadge,
  getDifficultyClasses,
  getDifficultyLabel,
  getScoreColorClass,
  normalizeToVigesimal,
  getProgressPercentage,
  EvaluationStatus,
  EvaluationDifficulty,
} from '@features/student/domain/utils/evaluation-utils';

@Component({
  selector: 'app-evaluations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evaluations.component.html',
  styles: ``
})
export class EvaluationsComponent implements OnInit {
  allEvaluations = signal<GlobalQuizSummary[]>([]);
  isLoading = signal(true);
  selectedFilter = signal<'all' | 'pending' | 'completed'>('all');
  selectedYear = signal<number>(new Date().getFullYear());

  /** Stats derived directly from loaded data — no second HTTP call. */
  stats = computed(() => {
    const evals = this.allEvaluations();
    const completed = evals.filter(e => e.status === 'completed');
    const pending = evals.filter(e => e.status !== 'completed');
    const urgent = evals.filter(e => e.status === 'urgent');
    const upcoming = evals.filter(e => e.status === 'upcoming');

    const normalizedScores = completed
      .map(e => normalizeToVigesimal(e.bestScore))
      .filter(s => s > 0);

    const averageScore = normalizedScores.length > 0
      ? Math.round((normalizedScores.reduce((sum, s) => sum + s, 0) / normalizedScores.length) * 10) / 10
      : 0;

    return {
      totalPending: pending.length,
      totalCompleted: completed.length,
      averageScore,
      urgentCount: urgent.length,
      upcomingCount: upcoming.length,
    };
  });

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

  evaluationsByCourse = computed(() => {
    const evals = this.filteredEvaluations();
    const grouped = new Map<string, GlobalQuizSummary[]>();

    evals.forEach(evaluation => {
      const courseEvals = grouped.get(evaluation.courseId) || [];
      courseEvals.push(evaluation);
      grouped.set(evaluation.courseId, courseEvals);
    });

    return Array.from(grouped.entries()).map(([courseId, evaluations]) => {
      const normalizedScores = evaluations
        .filter(e => e.bestScore !== undefined)
        .map(e => normalizeToVigesimal(e.bestScore));

      const totalCredits = normalizedScores.length > 0
        ? normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length
        : 0;

      return {
        courseId,
        courseName: evaluations[0].courseName,
        evaluations,
        totalCredits,
        progress: evaluations.filter(e => e.status === 'completed').length / evaluations.length * 100,
      };
    });
  });

  completedCourses = computed(() =>
    this.evaluationsByCourse().filter(course =>
      course.evaluations.length > 0 &&
      course.evaluations.every(e => e.status === 'completed')
    ).length
  );

  totalCoursesWithEvaluations = computed(() =>
    new Set(this.allEvaluations().map(e => e.courseId)).size
  );

  constructor(
    private evaluationsService: EvaluationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvaluations();
  }

  loadEvaluations(): void {
    this.evaluationsService.getAllEvaluations().subscribe({
      next: (evaluations) => {
        this.allEvaluations.set(evaluations);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setFilter(filter: 'all' | 'pending' | 'completed'): void {
    this.selectedFilter.set(filter);
  }

  navigateToCourse(courseId: string, evaluationId?: string): void {
    const queryParams: Record<string, string> = { tab: 'evaluations' };
    if (evaluationId) {
      queryParams['evaluationId'] = evaluationId;
    }
    this.router.navigate(['/student/course', courseId], { queryParams });
  }

  // --- Delegated to shared utils ---

  getStatusBadge(status: string) {
    return getStatusBadge(status as EvaluationStatus);
  }

  getScoreColor(score: number | undefined): string {
    return getScoreColorClass(score);
  }

  getDifficultyClass(difficulty: string): string {
    return getDifficultyClasses(difficulty as EvaluationDifficulty);
  }

  getDifficultyLabel(difficulty: string): string {
    return getDifficultyLabel(difficulty as EvaluationDifficulty);
  }

  getProgressPercentage(used: number, allowed: number): number {
    return getProgressPercentage(used, allowed);
  }
}
