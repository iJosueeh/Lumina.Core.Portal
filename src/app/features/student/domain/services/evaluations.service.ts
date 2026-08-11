import { Injectable } from '@angular/core';
import { Observable, map, forkJoin, of, switchMap, catchError, shareReplay } from 'rxjs';
import { GlobalQuizSummary, GlobalEvaluationsStats } from '../models/global-evaluation.model';
import { Quiz, QuizAttempt } from '../models/quiz.model';
import { EvaluationsIntegrationService } from '../../infrastructure/services/evaluations-integration.service';
import { CoursesRepository } from '../repositories/courses.repository';
import { AuthService } from '@core/services/auth.service';
import { EnrollmentService } from '../../infrastructure/services/enrollment.service';
import { normalizeToVigesimal } from '../utils/evaluation-utils';

@Injectable({ providedIn: 'root' })
export class EvaluationsService {
  /** Cached evaluations stream — avoids duplicate HTTP calls when both the page and stats request the same data. */
  private cachedEvaluations$: Observable<GlobalQuizSummary[]> | null = null;

  constructor(
    private evaluationsIntegrationService: EvaluationsIntegrationService,
    private coursesRepository: CoursesRepository,
    private authService: AuthService,
    private enrollmentService: EnrollmentService
  ) {}

  getAllEvaluations(forceRefresh = false): Observable<GlobalQuizSummary[]> {
    if (this.cachedEvaluations$ && !forceRefresh) {
      return this.cachedEvaluations$;
    }

    this.cachedEvaluations$ = this.fetchAllEvaluations().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return this.cachedEvaluations$;
  }

  getUpcomingEvaluations(limit: number = 5): Observable<GlobalQuizSummary[]> {
    return this.getAllEvaluations().pipe(
      map(evaluations => {
        const pending = evaluations
          .filter(e => e.status === 'urgent' || e.status === 'upcoming')
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        return pending.slice(0, limit);
      })
    );
  }

  getGlobalStats(): Observable<GlobalEvaluationsStats> {
    return this.getAllEvaluations().pipe(
      map(evaluations => {
        const completed = evaluations.filter(e => e.status === 'completed');
        const pending = evaluations.filter(e => e.status !== 'completed');
        const urgent = evaluations.filter(e => e.status === 'urgent');
        const upcoming = evaluations.filter(e => e.status === 'upcoming');

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
          upcomingCount: upcoming.length
        };
      })
    );
  }

  private fetchAllEvaluations(): Observable<GlobalQuizSummary[]> {
    const userId = this.authService.getUserId();
    if (!userId) return of([]);

    return this.enrollmentService.getStudentIdByUserId(userId).pipe(
      switchMap(studentId => {
        if (!studentId) return of([]);

        return this.coursesRepository.getStudentCourses(studentId).pipe(
          switchMap(courses => {
            if (courses.length === 0) return of([]);

            const requests = courses.map(course =>
              forkJoin({
                course: of(course),
                evaluations: this.evaluationsIntegrationService.getEvaluationsByCourse(course.id).pipe(
                  catchError(() => of([]))
                ),
                attempts: this.evaluationsIntegrationService.getQuizAttempts(studentId, course.id).pipe(
                  catchError(() => of([]))
                )
              })
            );

            return forkJoin(requests).pipe(
              map(results => {
                const all: GlobalQuizSummary[] = [];
                results.forEach(({ course, evaluations, attempts }) => {
                  evaluations.forEach(quiz => {
                    all.push(this.mapToGlobalSummary(quiz, attempts, course.titulo, course.id));
                  });
                });
                return all;
              })
            );
          })
        );
      }),
      catchError(() => of([]))
    );
  }

  private mapToGlobalSummary(quiz: Quiz, attempts: QuizAttempt[], courseName: string, courseId: string): GlobalQuizSummary {
    const quizAttempts = attempts.filter(a => a.quizId === quiz.id && a.status === 'completed');
    const bestAttempt = quizAttempts.reduce<QuizAttempt | null>(
      (best, current) => !best || (current.percentage || 0) > (best.percentage || 0) ? current : best,
      null
    );

    const dueDate = quiz.availableUntil ? new Date(quiz.availableUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const status = this.calculateStatus(dueDate, now, quizAttempts.length > 0);
    const timeRemaining = this.calculateTimeRemaining(dueDate, now);
    const bestScore = normalizeToVigesimal(bestAttempt?.percentage);

    return {
      id: quiz.id,
      title: quiz.title,
      courseId,
      courseName,
      courseColor: this.getCourseColor(courseId),
      dueDate,
      status,
      difficulty: quiz.difficulty,
      bestScore,
      attemptsUsed: quizAttempts.length,
      attemptsAllowed: quiz.config.attemptsAllowed,
      timeRemaining
    };
  }

  private getCourseColor(courseId: string): string {
    const colors = ['bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500'];
    return colors[courseId.charCodeAt(0) % colors.length];
  }

  private calculateStatus(dueDate: Date, now: Date, isCompleted: boolean): 'urgent' | 'upcoming' | 'available' | 'completed' {
    if (isCompleted) return 'completed';
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue < 24) return 'urgent';
    if (hoursUntilDue < 168) return 'upcoming';
    return 'available';
  }

  private calculateTimeRemaining(dueDate: Date, now: Date): string {
    const diff = dueDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Menos de 1 hora';
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
    if (days < 7) return `${days} día${days > 1 ? 's' : ''}`;
    const weeks = Math.floor(days / 7);
    return `${weeks} semana${weeks > 1 ? 's' : ''}`;
  }
}
