import { Injectable } from '@angular/core';
import { Observable, map, forkJoin, of, switchMap, catchError } from 'rxjs';
import { GlobalQuizSummary, GlobalEvaluationsStats } from '../models/global-evaluation.model';
import { Quiz, QuizAttempt } from '../models/quiz.model';
import { EvaluationsIntegrationService } from '../../infrastructure/services/evaluations-integration.service';
import { CoursesRepository } from '../repositories/courses.repository';
import { AuthService } from '@core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EvaluationsService {
  constructor(
    private evaluationsIntegrationService: EvaluationsIntegrationService,
    private coursesRepository: CoursesRepository,
    private authService: AuthService
  ) {}

  /**
   * Obtiene todas las evaluaciones de todos los cursos del estudiante
   */
  getAllEvaluations(): Observable<GlobalQuizSummary[]> {
    const studentId = this.authService.getUserId();
    
    if (!studentId) {
      console.error('❌ No se encontró el ID del estudiante');
      return of([]);
    }

    console.log('📚 Obteniendo cursos del estudiante:', studentId);
    
    return this.coursesRepository.getStudentCourses(studentId).pipe(
      switchMap(courses => {
        console.log('✅ Cursos obtenidos:', courses.length);
        
        if (courses.length === 0) {
          return of([]);
        }

        // Para cada curso, obtener sus evaluaciones y intentos
        const evaluationRequests = courses.map(course => 
          forkJoin({
            course: of(course),
            evaluations: this.evaluationsIntegrationService.getEvaluationsByCourse(course.id).pipe(
              catchError(error => {
                console.warn(`⚠️  Error al obtener evaluaciones del curso ${course.id}:`, error);
                return of([]);
              })
            ),
            attempts: this.evaluationsIntegrationService.getQuizAttempts(studentId, course.id).pipe(
              catchError(error => {
                console.warn(`⚠️  Error al obtener intentos del curso ${course.id}:`, error);
                return of([]);
              })
            )
          })
        );

        return forkJoin(evaluationRequests).pipe(
          map(results => {
            // Aplanar todas las evaluaciones de todos los cursos
            const allEvaluations: GlobalQuizSummary[] = [];
            
            results.forEach(({ course, evaluations, attempts }) => {
              evaluations.forEach(quiz => {
                const summary = this.mapToGlobalSummary(quiz, attempts, course.titulo, course.id);
                allEvaluations.push(summary);
              });
            });

            console.log('✅ Total de evaluaciones obtenidas:', allEvaluations.length);
            return allEvaluations;
          })
        );
      }),
      catchError(error => {
        console.error('❌ Error al obtener evaluaciones:', error);
        return of([]);
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

        // 🔄 Migración: Convertir bestScore de porcentajes (>20) a vigesimal
        const normalizedScores = completed
          .map(e => {
            const score = e.bestScore || 0;
            return score > 20 ? (score / 100) * 20 : score; // Convertir si es porcentaje
          })
          .filter(score => score > 0);

        const averageScore = normalizedScores.length > 0
          ? normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length
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
  private mapToGlobalSummary(quiz: Quiz, attempts: QuizAttempt[], courseName: string, courseId: string): GlobalQuizSummary {
    const quizAttempts = attempts.filter(a => a.quizId === quiz.id && a.status === 'completed');
    const bestAttempt = quizAttempts.reduce((best, current) => 
      !best || (current.percentage || 0) > (best.percentage || 0) ? current : best
    , null as QuizAttempt | null);

    const dueDate = quiz.availableUntil ? new Date(quiz.availableUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const status = this.calculateStatus(dueDate, now, quizAttempts.length > 0);
    const timeRemaining = this.calculateTimeRemaining(dueDate, now);

    // 🔄 Migración de datos: Convertir porcentajes antiguos (0-100) a vigesimal (0-20)
    let bestScore = bestAttempt?.percentage;
    if (bestScore && bestScore > 20) {
      // Dato antiguo en formato porcentaje, convertir a vigesimal
      bestScore = (bestScore / 100) * 20;
      console.warn(`🔄 Migrando nota de ${bestAttempt?.percentage}% a ${bestScore.toFixed(1)}/20`);
    }

    return {
      id: quiz.id,
      title: quiz.title,
      courseId: courseId,
      courseName: courseName,
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

  /**
   * Obtiene un color para el curso de forma determinista
   */
  private getCourseColor(courseId: string): string {
    const colors = [
      'bg-teal-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-emerald-500',
      'bg-amber-500'
    ];
    
    // Usar el primer carácter del ID para determinar el color
    const hash = courseId.charCodeAt(0) % colors.length;
    return colors[hash];
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
