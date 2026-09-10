import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, lastValueFrom } from 'rxjs';
import { EvaluationsService } from '@features/student/domain/services/evaluations.service';
import { EvaluationsIntegrationService } from '@features/student/infrastructure/services/evaluations-integration.service';
import { EnrollmentService } from '@features/student/infrastructure/services/enrollment.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@shared/services/notification.service';
import { GlobalQuizSummary } from '@features/student/domain/models/global-evaluation.model';
import { Quiz, QuizAttempt } from '@features/student/domain/models/quiz.model';
import { QuizTakeComponent } from '../../components/quiz-take/quiz-take.component';
import { QuizResultsComponent } from '../../components/quiz-results/quiz-results.component';
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
  imports: [CommonModule, QuizTakeComponent, QuizResultsComponent],
  templateUrl: './evaluations.component.html',
  styles: ``
})
export class EvaluationsComponent implements OnInit {
  private evaluationsService = inject(EvaluationsService);
  private evaluationsIntegrationService = inject(EvaluationsIntegrationService);
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  allEvaluations = signal<GlobalQuizSummary[]>([]);
  isLoading = signal(true);
  selectedFilter = signal<'all' | 'pending' | 'completed'>('all');
  selectedYear = signal<number>(new Date().getFullYear());

  // Modal / In-place evaluation execution state
  isQuizActive = signal(false);
  activeQuiz = signal<Quiz | any>(null);
  activeIntentoId = signal<string | null>(null);
  isStartingQuizId = signal<string | null>(null);
  isViewingResultsId = signal<string | null>(null);
  submittingQuiz = signal(false);
  isResultsActive = signal(false);
  activeResults = signal<{ quiz: any; attempt: any } | null>(null);
  currentEvaluation = signal<GlobalQuizSummary | null>(null);
  studentId = signal<string>('');

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

  ngOnInit(): void {
    this.loadEvaluations();
  }

  loadEvaluations(forceRefresh = false): void {
    if (!forceRefresh) {
      this.isLoading.set(true);
    }
    this.evaluationsService.getAllEvaluations(forceRefresh).subscribe({
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

  async startQuiz(evaluation: GlobalQuizSummary): Promise<void> {
    this.isStartingQuizId.set(evaluation.id);
    this.currentEvaluation.set(evaluation);
    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        this.notificationService.show('error', 'No se encontró sesión de usuario activa.');
        return;
      }

      let currentStudentId = this.studentId();
      if (!currentStudentId) {
        const resolved = await lastValueFrom(this.enrollmentService.getStudentIdByUserId(userId));
        if (!resolved) {
          this.notificationService.show('error', 'No se encontró el registro del estudiante.');
          return;
        }
        currentStudentId = resolved;
        this.studentId.set(resolved);
      }

      // 1. Create quiz attempt
      const attemptRes = await lastValueFrom(
        this.evaluationsIntegrationService.createQuizAttempt(evaluation.id, currentStudentId)
      );
      this.activeIntentoId.set(attemptRes.intentoId);

      // 2. Fetch full quiz with questions
      const fullQuiz = await lastValueFrom(
        this.evaluationsIntegrationService.getEvaluacionConPreguntas(evaluation.id)
      );

      this.activeQuiz.set(fullQuiz);
      this.isQuizActive.set(true);
    } catch (error) {
      console.error('Error al iniciar la evaluación:', error);
      this.notificationService.show('error', 'No se pudo iniciar la evaluación. Inténtalo nuevamente.');
    } finally {
      this.isStartingQuizId.set(null);
    }
  }

  async onQuizSubmit(attempt: any): Promise<void> {
    this.submittingQuiz.set(true);
    try {
      const studentId = this.studentId();
      const intentoId = this.activeIntentoId();

      if (!studentId || !intentoId) {
        throw new Error('Faltan credenciales del intento');
      }

      const result = await lastValueFrom(
        this.evaluationsIntegrationService.submitQuizAttempt(
          intentoId,
          attempt.answers,
          this.activeQuiz().totalPoints,
          studentId,
          attempt.timeSpent
        )
      );

      const completedAttempt: QuizAttempt = {
        ...attempt,
        id: result.intentoId,
        score: result.calificacion,
        percentage: result.calificacion,
        passed: result.calificacion >= 10.5
      };

      this.activeResults.set({ quiz: this.activeQuiz(), attempt: completedAttempt });
      this.isQuizActive.set(false);
      this.isResultsActive.set(true);

      // Refresh list to update scores and progress
      this.loadEvaluations(true);
    } catch (error) {
      console.error('Error al enviar la evaluación:', error);
      this.notificationService.show('error', 'Ocurrió un error al enviar tus respuestas.');
    } finally {
      this.submittingQuiz.set(false);
    }
  }

  async viewResults(evaluation: GlobalQuizSummary): Promise<void> {
    this.isViewingResultsId.set(evaluation.id);
    this.currentEvaluation.set(evaluation);
    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        this.notificationService.show('error', 'No se encontró sesión de usuario activa.');
        return;
      }

      let currentStudentId = this.studentId();
      if (!currentStudentId) {
        const resolved = await lastValueFrom(this.enrollmentService.getStudentIdByUserId(userId));
        if (!resolved) {
          this.notificationService.show('error', 'No se encontró el registro del estudiante.');
          return;
        }
        currentStudentId = resolved;
        this.studentId.set(resolved);
      }

      const results = await lastValueFrom(
        forkJoin({
          quiz: this.evaluationsIntegrationService.getEvaluacionConPreguntas(evaluation.id),
          attempts: this.evaluationsIntegrationService.getQuizAttempts(currentStudentId, evaluation.courseId)
        })
      );

      const fullQuiz = results.quiz;
      const attempts = results.attempts;

      const completedAttempt = attempts
        .filter((a: QuizAttempt) => a.quizId === evaluation.id && a.status === 'completed')
        .sort((a: QuizAttempt, b: QuizAttempt) => {
          const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          return timeB - timeA;
        })[0];

      if (!completedAttempt) {
        this.notificationService.show('info', 'No se encontró un intento completado para esta evaluación.');
        return;
      }

      this.activeResults.set({ quiz: fullQuiz, attempt: completedAttempt });
      this.isResultsActive.set(true);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      this.notificationService.show('error', 'No se pudieron obtener los resultados de la evaluación.');
    } finally {
      this.isViewingResultsId.set(null);
    }
  }

  retryQuiz(): void {
    const current = this.currentEvaluation();
    this.isResultsActive.set(false);
    if (current && current.attemptsUsed < current.attemptsAllowed) {
      this.startQuiz(current);
    }
  }

  navigateToCourse(courseId: string, evaluationId?: string): void {
    const queryParams: Record<string, string> = { tab: 'evaluaciones' };
    if (evaluationId) {
      queryParams['evaluationId'] = evaluationId;
    }
    this.router.navigate(['/student/course', courseId], { queryParams });
  }

  printEvaluations(): void {
    window.print();
  }

  exportCSV(): void {
    const data = this.filteredEvaluations();
    if (!data.length) return;

    const headers = ['Curso', 'Evaluación', 'Dificultad', 'Intentos Usados', 'Intentos Permitidos', 'Nota Final (/20)', 'Estado', 'Vence'];
    const rows = data.map(e => [
      `"${e.courseName.replace(/"/g, '""')}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${this.getDifficultyLabel(e.difficulty)}"`,
      e.attemptsUsed,
      e.attemptsAllowed,
      e.bestScore !== undefined ? normalizeToVigesimal(e.bestScore).toFixed(1) : 'N/A',
      `"${this.getStatusBadge(e.status).text}"`,
      `"${e.timeRemaining || 'N/A'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mis_Evaluaciones_${this.selectedYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

