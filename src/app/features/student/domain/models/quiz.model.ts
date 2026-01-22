// Tipos de preguntas soportadas
export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'matching';

// Estados de un quiz
export type QuizStatus = 'not-started' | 'in-progress' | 'completed' | 'expired';

// Niveles de dificultad
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Opción para preguntas de selección
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// Pregunta individual
export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: QuestionOption[]; // Para multiple-choice y true-false
  correctAnswer?: string; // Para short-answer
  explanation?: string; // Explicación de la respuesta correcta
  imageUrl?: string; // Imagen opcional para la pregunta
}

// Configuración de un quiz
export interface QuizConfig {
  timeLimit?: number; // Tiempo límite en minutos (opcional)
  attemptsAllowed: number; // Número de intentos permitidos
  shuffleQuestions: boolean; // Mezclar orden de preguntas
  shuffleOptions: boolean; // Mezclar orden de opciones
  showCorrectAnswers: boolean; // Mostrar respuestas correctas después de completar
  passingScore: number; // Porcentaje mínimo para aprobar (0-100)
}

// Quiz principal
export interface Quiz {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  moduleName: string;
  courseId: string;
  difficulty: DifficultyLevel;
  totalPoints: number;
  totalQuestions: number;
  questions: Question[];
  config: QuizConfig;
  availableFrom: Date;
  availableUntil?: Date; // Fecha límite (opcional)
  weight: number; // Peso en la nota final del curso (0-1)
  createdAt: Date;
  updatedAt?: Date;
}

// Respuesta del estudiante a una pregunta
export interface QuestionAnswer {
  questionId: string;
  answer: string | string[]; // string para short-answer, string[] para multiple-choice
  isCorrect?: boolean; // Se calcula después de enviar
  pointsEarned?: number;
  timeSpent?: number; // Tiempo en segundos
}

// Intento de quiz
export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attemptNumber: number; // 1, 2, 3, etc.
  status: 'in-progress' | 'completed' | 'abandoned';
  answers: QuestionAnswer[];
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number; // Tiempo total en minutos
  score?: number; // Puntos obtenidos
  percentage?: number; // Porcentaje (0-100)
  passed?: boolean; // Si aprobó o no
}

// Resultado de un quiz (estadísticas agregadas)
export interface QuizResult {
  quizId: string;
  studentId: string;
  attempts: QuizAttempt[];
  bestAttempt?: QuizAttempt;
  averageScore: number;
  averagePercentage: number;
  totalAttempts: number;
  attemptsRemaining: number;
  lastAttemptDate?: Date;
  isPassed: boolean;
}

// Estadísticas de un quiz (para comparación con la clase)
export interface QuizStats {
  quizId: string;
  totalStudents: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
  passRate: number; // Porcentaje de estudiantes que aprobaron
  completionRate: number; // Porcentaje de estudiantes que completaron
}

// Vista resumida de quiz para listados
export interface QuizSummary {
  id: string;
  title: string;
  moduleId: string;
  moduleName: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  totalPoints: number;
  timeLimit?: number;
  availableFrom: Date;
  availableUntil?: Date;
  status: QuizStatus;
  attemptsUsed: number;
  attemptsAllowed: number;
  bestScore?: number;
  bestPercentage?: number;
  passed?: boolean;
}
