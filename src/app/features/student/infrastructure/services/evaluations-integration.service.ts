import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { Quiz, QuizAttempt } from '../../domain/models/course-detail.model';
import { DifficultyLevel, Question, QuestionOption, QuestionType } from '../../domain/models/quiz.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '@core/services/cache.service';

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
  totalPreguntas: number;
}

interface EvaluacionConPreguntasResponse {
  id: string;
  titulo: string;
  descripcion: string;
  cursoId: string;
  fechaInicio: string;
  fechaFin: string;
  puntajeMaximo: number;
  tipoEvaluacion: string;
  estado: string;
  preguntas: PreguntaResponse[];
}

interface PreguntaResponse {
  id: string;
  tipo: string;
  texto: string;
  puntos: number;
  respuestaCorrecta: string | null;
  explicacion: string | null;
  imagenUrl: string | null;
  orden: number;
  opciones: OpcionResponse[] | null;
}

interface OpcionResponse {
  id: string;
  texto: string;
  esCorrecta: boolean;
  orden: number;
}

@Injectable({ providedIn: 'root' })
export class EvaluationsIntegrationService {
  private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(private http: HttpClient, private cacheService: CacheService) {}

  getEvaluationsByCourse(courseId: string): Observable<Quiz[]> {
    const cacheKey = `course-evaluations-${courseId}`;
    return this.http.get<{ evaluaciones: EvaluacionResponse[] }>(`${this.evaluacionesApiUrl}/evaluaciones?cursoId=${courseId}`)
      .pipe(
        map(response => response.evaluaciones.map(e => this.mapToQuiz(e))),
        tap(quizzes => this.cacheService.set(cacheKey, quizzes, this.CACHE_TTL)),
        catchError(error => {
          console.error('Error al cargar evaluaciones:', error);
          return throwError(() => error);
        })
      );
  }

  getQuizAttempts(studentId: string, courseId: string): Observable<QuizAttempt[]> {
    const cacheKey = `quiz-attempts-${studentId}-${courseId}`;
    return this.http.get<{ intentos: any[] }>(`${this.evaluacionesApiUrl}/evaluaciones/intentos?estudianteId=${studentId}&cursoId=${courseId}`)
      .pipe(
        map(response => (response.intentos || []).map((i: any) => this.mapToQuizAttempt(i))),
        tap(attempts => this.cacheService.set(cacheKey, attempts, this.CACHE_TTL))
      );
  }

  private mapToQuizAttempt(intento: any): QuizAttempt {
    const answers = (intento.answers || intento.respuestas || []).map((r: any) => ({
      questionId: r.questionId || r.preguntaId,
      answer: r.answer || r.respuestaEstudiante,
      isCorrect: r.isCorrect ?? r.esCorrecta ?? false,
      pointsEarned: r.pointsEarned ?? r.puntosObtenidos ?? 0
    }));

    return {
      id: intento.id,
      quizId: intento.quizId || intento.evaluacionId,
      studentId: intento.studentId || intento.estudianteId,
      attemptNumber: intento.attemptNumber || intento.numeroIntento || 1,
      status: (intento.status || intento.estado || 'completed') as 'in-progress' | 'completed' | 'abandoned',
      answers,
      startedAt: new Date(intento.startedAt || intento.fechaInicio),
      completedAt: intento.completedAt ? new Date(intento.completedAt) :
        intento.fechaFin ? new Date(intento.fechaFin) : undefined,
      timeSpent: intento.timeSpent || intento.tiempoEmpleado || 0,
      score: intento.score || intento.puntaje || 0,
      percentage: intento.percentage || intento.porcentaje || 0,
      passed: intento.passed ?? intento.aprobado ?? false
    };
  }

  private mapToQuiz(e: EvaluacionResponse): Quiz {
    return {
      id: e.id,
      title: e.titulo,
      courseId: e.cursoId,
      moduleId: '',
      moduleName: '',
      description: '',
      totalQuestions: e.totalPreguntas,
      totalPoints: 100,
      difficulty: 'medium' as DifficultyLevel,
      availableFrom: new Date(e.fechaInicio),
      availableUntil: e.fechaLimite ? new Date(e.fechaLimite) : undefined,
      weight: 0.1,
      createdAt: new Date(e.fechaInicio),
      updatedAt: undefined,
      config: {
        timeLimit: e.duracionMinutos,
        attemptsAllowed: e.intentosMaximos,
        passingScore: 70,
        showCorrectAnswers: false,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: []
    };
  }

  getEvaluacionConPreguntas(evaluacionId: string): Observable<Quiz> {
    this.cacheService.invalidatePattern(`evaluation-with-questions-${evaluacionId}`);
    return this.http.get<EvaluacionConPreguntasResponse>(`${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`)
      .pipe(
        map(response => this.mapToQuizWithQuestions(response)),
        catchError(error => {
          console.error('Error al cargar evaluación con preguntas:', error);
          return throwError(() => error);
        })
      );
  }

  private mapToQuizWithQuestions(e: EvaluacionConPreguntasResponse): Quiz {
    return {
      id: e.id,
      title: e.titulo,
      description: e.descripcion,
      courseId: e.cursoId,
      moduleId: '',
      moduleName: '',
      totalQuestions: e.preguntas.length,
      totalPoints: e.puntajeMaximo,
      difficulty: 'medium' as DifficultyLevel,
      availableFrom: new Date(e.fechaInicio),
      availableUntil: new Date(e.fechaFin),
      weight: 0.1,
      createdAt: new Date(e.fechaInicio),
      updatedAt: undefined,
      config: {
        timeLimit: undefined,
        attemptsAllowed: 3,
        passingScore: 70,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: e.preguntas.map(p => this.mapToQuestion(p))
    };
  }

  private mapToQuestion(p: PreguntaResponse): Question {
    return {
      id: p.id,
      type: p.tipo as QuestionType,
      text: p.texto,
      points: p.puntos,
      options: p.opciones?.map(o => this.mapToQuestionOption(o)),
      correctAnswer: p.respuestaCorrecta || undefined,
      explanation: p.explicacion || undefined,
      imageUrl: undefined
    };
  }

  private mapToQuestionOption(o: OpcionResponse): QuestionOption {
    return { id: o.id, text: o.texto, isCorrect: o.esCorrecta };
  }

  createQuizAttempt(evaluacionId: string, estudianteId: string): Observable<{ intentoId: string }> {
    return this.http.post<{ intentoId: string }>(
      `${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/intentos`,
      { estudianteId }
    ).pipe(
      tap(() => this.cacheService.invalidatePattern(`quiz-attempts-${estudianteId}`)),
      catchError(error => {
        console.error('Error al crear intento:', error);
        return throwError(() => error);
      })
    );
  }

  submitQuizAttempt(
    intentoId: string,
    respuestas: Array<{ preguntaId: string; respuestaEstudiante: string; esCorrecta: boolean; puntosObtenidos: number }>,
    puntajeMaximo: number,
    estudianteId: string,
    tiempoEmpleadoMinutos?: number
  ): Observable<{ intentoId: string; calificacion: number; respuestasCorrectas: number; totalPreguntas: number }> {
    const safeRespuestas = (respuestas || []).map((r: any) => ({
      preguntaId: r.preguntaId || r.questionId,
      respuestaEstudiante: Array.isArray(r.respuestaEstudiante || r.answer)
        ? (r.respuestaEstudiante || r.answer).join(', ')
        : (r.respuestaEstudiante || r.answer || ''),
      esCorrecta: r.esCorrecta ?? r.isCorrect ?? false,
      puntosObtenidos: r.puntosObtenidos ?? r.pointsEarned ?? 0
    }));

    return this.http.post<{ intentoId: string; calificacion: number; respuestasCorrectas: number; totalPreguntas: number }>(
      `${this.evaluacionesApiUrl}/evaluaciones/intentos/${intentoId}/completar`,
      { respuestas: safeRespuestas, puntajeMaximo, tiempoEmpleadoMinutos }
    ).pipe(
      tap(() => this.cacheService.invalidatePattern(`quiz-attempts-${estudianteId}`)),
      catchError(error => {
        console.error('Error al enviar respuestas:', error);
        return throwError(() => error);
      })
    );
  }

  abandonQuizAttempt(intentoId: string): Observable<void> {
    return this.http.post<void>(`${this.evaluacionesApiUrl}/evaluaciones/intentos/${intentoId}/abandonar`, {})
      .pipe(
        catchError(error => {
          console.warn('No se pudo abandonar el intento:', error);
          return throwError(() => error);
        })
      );
  }
}
