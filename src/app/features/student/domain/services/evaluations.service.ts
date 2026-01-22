import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';
import { GlobalQuizSummary, GlobalEvaluationsStats } from '../models/global-evaluation.model';
import { Quiz, QuizAttempt } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluationsService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las evaluaciones de todos los cursos
   */
  getAllEvaluations(): Observable<GlobalQuizSummary[]> {
    return forkJoin({
      quizzes: this.http.get<Quiz[]>('/assets/mock-data/quizzes/quizzes.json'),
      attempts: this.http.get<QuizAttempt[]>('/assets/mock-data/quizzes/quiz-attempts.json')
    }).pipe(
      map(({ quizzes, attempts }) => {
        return quizzes.map(quiz => this.mapToGlobalSummary(quiz, attempts));
      })
    );
  }

  /**
   * Obtiene evaluaciones próximas a vencer
   */
  getUpcomingEvaluations(limit: number = 5): Observable<GlobalQuizSummary[]> {
    return this.getAllEvaluations().pipe(
      map(evaluations => {
        // Filtrar solo pendientes y ordenar por fecha
        const pending = evaluations
          .filter(e => e.status === 'urgent' || e.status === 'upcoming')
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        
        return pending.slice(0, limit);
      })
    );
  }

  /**
   * Calcula estadísticas globales
   */
  getGlobalStats(): Observable<GlobalEvaluationsStats> {
    return this.getAllEvaluations().pipe(
      map(evaluations => {
        const completed = evaluations.filter(e => e.status === 'completed');
        const pending = evaluations.filter(e => e.status !== 'completed');
        const urgent = evaluations.filter(e => e.status === 'urgent');
        const upcoming = evaluations.filter(e => e.status === 'upcoming');

        const averageScore = completed.length > 0
          ? completed.reduce((sum, e) => sum + (e.bestScore || 0), 0) / completed.length
          : 0;

        return {
          totalPending: pending.length,
          totalCompleted: completed.length,
          averageScore: Math.round(averageScore * 10) / 10,
          urgentCount: urgent.length,
          upcomingCount: upcoming.length
        };
      })
    );
  }

  /**
   * Mapea un Quiz a GlobalQuizSummary
   */
  private mapToGlobalSummary(quiz: Quiz, attempts: QuizAttempt[]): GlobalQuizSummary {
    const quizAttempts = attempts.filter(a => a.quizId === quiz.id && a.status === 'completed');
    const bestAttempt = quizAttempts.reduce((best, current) => 
      !best || (current.percentage || 0) > (best.percentage || 0) ? current : best
    , null as QuizAttempt | null);

    const dueDate = quiz.availableUntil ? new Date(quiz.availableUntil) : new Date();
    const now = new Date();
    const status = this.calculateStatus(dueDate, now, quizAttempts.length > 0);
    const timeRemaining = this.calculateTimeRemaining(dueDate, now);

    return {
      id: quiz.id,
      title: quiz.title,
      courseId: quiz.courseId,
      courseName: 'Desarrollo Web Full Stack', // TODO: Obtener del curso
      courseColor: 'bg-teal-500', // TODO: Obtener del curso
      dueDate,
      status,
      difficulty: quiz.difficulty,
      bestScore: bestAttempt?.percentage,
      attemptsUsed: quizAttempts.length,
      attemptsAllowed: quiz.config.attemptsAllowed,
      timeRemaining
    };
  }

  /**
   * Calcula el estado de la evaluación
   */
  private calculateStatus(
    dueDate: Date, 
    now: Date, 
    isCompleted: boolean
  ): 'urgent' | 'upcoming' | 'available' | 'completed' {
    if (isCompleted) return 'completed';

    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 24) return 'urgent';
    if (hoursUntilDue < 168) return 'upcoming'; // 7 días
    return 'available';
  }

  /**
   * Calcula el tiempo restante en formato legible
   */
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
