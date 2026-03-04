import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap, catchError, throwError } from 'rxjs';
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
  tipo: string; // 'multiple-choice' | 'true-false' | 'short-answer' | 'matching'
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

@Injectable({
  providedIn: 'root'
})
export class EvaluationsIntegrationService {
  private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) { }

  getEvaluationsByCourse(courseId: string): Observable<Quiz[]> {
    const cacheKey = `course-evaluations-${courseId}`;

    // Sin caché para evaluaciones (para obtener siempre intentos actualizados del backend)
    console.log('📡 Realizando petición HTTP para evaluaciones:', cacheKey);
    return this.http.get<{ evaluaciones: EvaluacionResponse[] }>(`${this.evaluacionesApiUrl}/evaluaciones?cursoId=${courseId}`)
      .pipe(
        map(response => response.evaluaciones.map(e => this.mapToQuiz(e))),
        tap(quizzes => {
          this.cacheService.set(cacheKey, quizzes, this.CACHE_TTL);
          console.log('💾 Evaluaciones almacenadas en caché:', cacheKey, quizzes.length, 'items');
        }),
        catchError(error => {
          console.error('❌ Error al cargar evaluaciones del backend:', error);
          if (error.status === 401) {
            console.error('⚠️  Token no válido o expirado. Intente iniciar sesión nuevamente.');
          }
          return throwError(() => error);
        })
      );
  }

  getQuizAttempts(studentId: string, courseId: string): Observable<QuizAttempt[]> {
    const cacheKey = `quiz-attempts-${studentId}-${courseId}`;

    // Sin caché para intentos (para reflejar siempre el estado actual)
    console.log('📡 Realizando petición HTTP para intentos de evaluaciones:', cacheKey);
    return this.http.get<{ intentos: any[] }>(`${this.evaluacionesApiUrl}/evaluaciones/intentos?estudianteId=${studentId}&cursoId=${courseId}`)
      .pipe(
        map(response => (response.intentos || []).map(i => this.mapToQuizAttempt(i))),
        tap(attempts => {
          this.cacheService.set(cacheKey, attempts, this.CACHE_TTL);
          console.log('💾 Intentos almacenados en caché:', cacheKey, attempts.length, 'items');
        }),
        catchError(error => {
          console.error('❌ Error al cargar intentos de evaluaciones del backend:', error);
          if (error.status === 401) {
            console.error('⚠️  Token no válido o expirado. Intente iniciar sesión nuevamente.');
          }
          // Devolver array vacío en caso de error para que la UI no falle
          return of([]);
        })
      );
  }

  private mapToQuizAttempt(intento: any): QuizAttempt {
    console.log('🔄 Mapeando intento del backend:', intento);

    // Mapear respuestas con normalización de nombres de propiedades
    const answers = (intento.answers || intento.respuestas || []).map((r: any) => ({
      questionId: r.questionId || r.preguntaId,
      answer: r.answer || r.respuestaEstudiante,
      isCorrect: r.isCorrect ?? r.esCorrecta ?? false,
      pointsEarned: r.pointsEarned ?? r.puntosObtenidos ?? 0
    }));

    const mapped = {
      id: intento.id,
      quizId: intento.quizId || intento.evaluacionId,
      studentId: intento.studentId || intento.estudianteId,
      attemptNumber: intento.attemptNumber || intento.numeroIntento || 1,
      status: (intento.status || intento.estado || 'completed') as 'in-progress' | 'completed' | 'abandoned',
      answers: answers,
      startedAt: new Date(intento.startedAt || intento.fechaInicio),
      completedAt: intento.completedAt ? new Date(intento.completedAt) :
        intento.fechaFin ? new Date(intento.fechaFin) : undefined,
      timeSpent: intento.timeSpent || intento.tiempoEmpleado || 0,
      score: intento.score || intento.puntaje || 0,
      percentage: intento.percentage || intento.porcentaje || 0,
      passed: intento.passed ?? intento.aprobado ?? false
    };

    console.log('✅ Intento mapeado con', mapped.answers.length, 'respuestas');

    return mapped;
  }

  private mapToQuiz(evaluacion: EvaluacionResponse): Quiz {
    return {
      id: evaluacion.id,
      title: evaluacion.titulo,
      courseId: evaluacion.cursoId,
      moduleId: '', // TODO: Agregar al backend si es necesario
      moduleName: '', // TODO: Agregar al backend si es necesario
      description: '', // TODO: Agregar descripción en backend
      totalQuestions: evaluacion.totalPreguntas,
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
      questions: [] // Cargaremos las preguntas por separado
    };
  }

  /**
   * Obtiene una evaluación con todas sus preguntas
   */
  getEvaluacionConPreguntas(evaluacionId: string): Observable<Quiz> {
    const cacheKey = `evaluation-with-questions-${evaluacionId}`;

    // Verificar si existe en caché
    const cachedData = this.cacheService.get<Quiz>(cacheKey);
    if (cachedData) {
      console.log('✅ Evaluación con preguntas obtenida del caché:', cacheKey);
      return of(cachedData);
    }

    console.log('📡 Realizando petición HTTP para evaluación con preguntas:', evaluacionId);
    return this.http.get<EvaluacionConPreguntasResponse>(`${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`)
      .pipe(
        map(response => this.mapToQuizWithQuestions(response)),
        tap(quiz => {
          this.cacheService.set(cacheKey, quiz, this.CACHE_TTL);
          console.log('💾 Evaluación con preguntas almacenada en caché:', cacheKey, quiz.questions.length, 'preguntas');
        }),
        catchError(error => {
          console.error('❌ Error al cargar evaluación con preguntas:', error);
          if (error.status === 401) {
            console.error('⚠️ Token no válido o expirado. Intente iniciar sesión nuevamente.');
          }
          return throwError(() => error);
        })
      );
  }

  private mapToQuizWithQuestions(evaluacion: EvaluacionConPreguntasResponse): Quiz {
    return {
      id: evaluacion.id,
      title: evaluacion.titulo,
      description: evaluacion.descripcion,
      courseId: evaluacion.cursoId,
      moduleId: '',
      moduleName: '',
      totalQuestions: evaluacion.preguntas.length,
      totalPoints: evaluacion.puntajeMaximo,
      difficulty: 'medium' as DifficultyLevel,
      availableFrom: new Date(evaluacion.fechaInicio),
      availableUntil: new Date(evaluacion.fechaFin),
      weight: 0.1,
      createdAt: new Date(evaluacion.fechaInicio),
      updatedAt: undefined,
      config: {
        timeLimit: undefined, // Se puede agregar al backend si es necesario
        attemptsAllowed: 3, // Default, se puede agregar al backend
        passingScore: 70,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        shuffleOptions: false
      },
      questions: evaluacion.preguntas.map(p => this.mapToQuestion(p))
    };
  }

  private mapToQuestion(pregunta: PreguntaResponse): Question {
    return {
      id: pregunta.id,
      type: pregunta.tipo as QuestionType,
      text: pregunta.texto,
      points: pregunta.puntos,
      options: pregunta.opciones?.map(o => this.mapToQuestionOption(o)),
      correctAnswer: pregunta.respuestaCorrecta || undefined,
      explanation: pregunta.explicacion || undefined,
      imageUrl: undefined
    };
  }

  private mapToQuestionOption(opcion: OpcionResponse): QuestionOption {
    return {
      id: opcion.id,
      text: opcion.texto,
      isCorrect: opcion.esCorrecta
    };
  }

  /**
   * Crea un nuevo intento de evaluación para un estudiante
   */
  createQuizAttempt(evaluacionId: string, estudianteId: string): Observable<{ intentoId: string }> {
    console.log('📡 Creando nuevo intento de evaluación:', { evaluacionId, estudianteId });
    return this.http.post<{ intentoId: string }>(
      `${this.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/intentos`,
      { estudianteId }
    ).pipe(
      tap(response => {
        console.log('✅ Intento creado exitosamente:', response.intentoId);
        // Invalidar caché de intentos
        this.cacheService.invalidatePattern(`quiz-attempts-${estudianteId}`);
      }),
      catchError(error => {
        console.error('❌ Error al crear intento de evaluación:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Completa un intento de evaluación enviando las respuestas del estudiante
   */
  submitQuizAttempt(
    intentoId: string,
    respuestas: Array<{
      preguntaId: string;
      respuestaEstudiante: string;
      esCorrecta: boolean;
      puntosObtenidos: number;
    }>,
    puntajeMaximo: number,
    estudianteId: string,
    tiempoEmpleadoMinutos?: number
  ): Observable<{
    intentoId: string;
    calificacion: number;
    respuestasCorrectas: number;
    totalPreguntas: number;
  }> {
    console.log('📡 Enviando respuestas de evaluación:', { intentoId, respuestas: respuestas.length, puntajeMaximo });
    return this.http.post<{
      intentoId: string;
      calificacion: number;
      respuestasCorrectas: number;
      totalPreguntas: number;
    }>(
      `${this.evaluacionesApiUrl}/evaluaciones/intentos/${intentoId}/completar`,
      {
        respuestas: respuestas.map(r => ({
          preguntaId: r.preguntaId,
          respuestaEstudiante: r.respuestaEstudiante,
          esCorrecta: r.esCorrecta,
          puntosObtenidos: r.puntosObtenidos
        })),
        puntajeMaximo,
        tiempoEmpleadoMinutos
      }
    ).pipe(
      tap(result => {
        console.log('✅ Evaluación completada exitosamente:', result);
        // Invalidar caché de intentos
        this.cacheService.invalidatePattern(`quiz-attempts-${estudianteId}`);
      }),
      catchError(error => {
        console.error('❌ Error al enviar respuestas de evaluación:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Abandona un intento de evaluación en progreso
   */
  abandonQuizAttempt(intentoId: string): Observable<void> {
    console.log('💤 Abandonando intento:', intentoId);
    return this.http.post<void>(
      `${this.evaluacionesApiUrl}/evaluaciones/intentos/${intentoId}/abandonar`,
      {}
    ).pipe(
      catchError(error => {
        // Silenciar el error en abandon (best-effort)
        console.warn('⚠️ No se pudo marcar el intento como abandonado:', error);
        return of(undefined as void);
      })
    );
  }
}

