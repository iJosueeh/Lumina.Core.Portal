import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Quiz, QuizAttempt } from '../../domain/models/course-detail.model';
import { DifficultyLevel } from '../../domain/models/quiz.model';
import { environment } from '../../../../../environments/environment';

interface EvaluacionResponse {
  id: string;
  titulo: string;
  cursoId: string;
  cursoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimite: string;
  duracionMinutos: number;
  duracion: number;
  estado: string;
  tipo: string;
  intentos: number;
  intentosMaximos: number;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationsIntegrationService {
  private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;

  constructor(private http: HttpClient) {}

  getEvaluationsByCourse(courseId: string): Observable<Quiz[]> {
    return this.http.get<{evaluaciones: EvaluacionResponse[]}>(`${this.evaluacionesApiUrl}/evaluaciones?cursoId=${courseId}`)
      .pipe(
        map(response => response.evaluaciones.map(e => this.mapToQuiz(e)))
      );
  }

  getQuizAttempts(studentId: string, courseId: string): Observable<QuizAttempt[]> {
    // TODO: Implementar cuando el backend tenga endpoint para intentos de quiz
    console.warn('⚠️ Endpoint de intentos de evaluaciones no implementado aún en el backend');
    return new Observable<QuizAttempt[]>(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  private mapToQuiz(evaluacion: EvaluacionResponse): Quiz {
    return {
      id: evaluacion.id,
      title: evaluacion.titulo,
      courseId: evaluacion.cursoId,
      moduleId: '', // TODO: Agregar al backend si es necesario
      moduleName: '', // TODO: Agregar al backend si es necesario
      description: '', // TODO: Agregar descripción en backend
      totalQuestions: 0, // TODO: Obtener del backend
      totalPoints: 100,
      difficulty: 'medium' as DifficultyLevel,
      availableFrom: new Date(evaluacion.fechaInicio),
      availableUntil: evaluacion.fechaLimite ? new Date(evaluacion.fechaLimite) : undefined,
      weight: 0.1, // TODO: Obtener del backend o configurar
      createdAt: new Date(evaluacion.fechaInicio),
      updatedAt: undefined, // TODO: Agregar fechaActualizacion en backend
      config: {
        timeLimit: evaluacion.duracionMinutos,
        attemptsAllowed: evaluacion.intentosMaximos,
        passingScore: 70,
        showCorrectAnswers: false,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: [] // TODO: Cargar desde el backend cuando inicie el quiz
    };
  }
}
