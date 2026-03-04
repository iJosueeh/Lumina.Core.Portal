import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quiz, QuizAttempt, Question, QuestionAnswer } from '@features/student/domain/models/quiz.model';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-quiz-take',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-take.component.html',
  styles: ``,
})
export class QuizTakeComponent implements OnInit, OnDestroy {
  @Input() quiz!: Quiz;
  @Input() attempt?: QuizAttempt;
  @Output() onSubmit = new EventEmitter<QuizAttempt>();
  @Output() onCancel = new EventEmitter<void>();

  constructor(private authService: AuthService) {}

  // Signals para gestión de estado
  currentQuestionIndex = signal(0);
  answers = signal<Map<string, string | string[]>>(new Map());
  timeRemaining = signal<number>(0);
  isSubmitting = signal(false);
  showConfirmDialog = signal(false);

  // Timer
  private timerInterval?: number;
  private startTime: Date = new Date();

  // Computed
  currentQuestion = computed(() => {
    if (!this.quiz?.questions || this.quiz.questions.length === 0) {
      return null;
    }
    const index = this.currentQuestionIndex();
    return this.quiz.questions[index];
  });

  progress = computed(() => {
    if (!this.quiz?.questions || this.quiz.questions.length === 0) {
      return 0;
    }
    const total = this.quiz.questions.length;
    const answered = Array.from(this.answers().keys()).length;
    return (answered / total) * 100;
  });

  answeredCount = computed(() => {
    return Array.from(this.answers().keys()).length;
  });

  canGoNext = computed(() => {
    if (!this.quiz?.questions) return false;
    return this.currentQuestionIndex() < this.quiz.questions.length - 1;
  });

  canGoPrevious = computed(() => {
    return this.currentQuestionIndex() > 0;
  });

  isLastQuestion = computed(() => {
    if (!this.quiz?.questions) return true;
    return this.currentQuestionIndex() === this.quiz.questions.length - 1;
  });

  ngOnInit(): void {
    // Si hay un attempt previo, cargar respuestas
    if (this.attempt) {
      const answersMap = new Map<string, string | string[]>();
      this.attempt.answers.forEach(ans => {
        answersMap.set(ans.questionId, ans.answer);
      });
      this.answers.set(answersMap);
    }

    // Iniciar timer si hay límite de tiempo
    if (this.quiz.config.timeLimit) {
      this.timeRemaining.set(this.quiz.config.timeLimit * 60); // Convertir a segundos
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      const remaining = this.timeRemaining();
      if (remaining > 0) {
        this.timeRemaining.set(remaining - 1);
      } else {
        // Tiempo agotado, enviar automáticamente
        this.stopTimer();
        this.submitQuiz();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  getTimerDisplay(): string {
    const seconds = this.timeRemaining();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getTimerColor(): string {
    const seconds = this.timeRemaining();
    const totalSeconds = (this.quiz.config.timeLimit || 0) * 60;
    const percentage = (seconds / totalSeconds) * 100;

    if (percentage > 50) return 'text-green-500';
    if (percentage > 25) return 'text-yellow-500';
    return 'text-red-500';
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.quiz.questions.length) {
      this.currentQuestionIndex.set(index);
    }
  }

  nextQuestion(): void {
    if (this.canGoNext()) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  previousQuestion(): void {
    if (this.canGoPrevious()) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  onAnswerChange(questionId: string, answer: string | string[]): void {
    const newAnswers = new Map(this.answers());
    newAnswers.set(questionId, answer);
    this.answers.set(newAnswers);
  }

  isQuestionAnswered(questionId: string): boolean {
    return this.answers().has(questionId);
  }

  getCurrentAnswer(): string | string[] | undefined {
    const currentQ = this.currentQuestion();
    if (!currentQ) return undefined;
    return this.answers().get(currentQ.id);
  }

  confirmSubmit(): void {
    this.showConfirmDialog.set(true);
  }

  cancelSubmit(): void {
    this.showConfirmDialog.set(false);
  }

  submitQuiz(): void {
    this.isSubmitting.set(true);
    this.stopTimer();

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000 / 60); // en minutos

    console.log('📝 Enviando evaluación...');
    console.log('📊 Respuestas del estudiante:', Array.from(this.answers().entries()));

    // Crear QuizAttempt
    const questionAnswers: QuestionAnswer[] = this.quiz.questions.map(question => {
      const answer = this.answers().get(question.id);
      const isCorrect = this.checkAnswer(question, answer);
      const pointsEarned = isCorrect ? question.points : 0;

      console.log(`❓ Pregunta ${question.id}:`, {
        texto: question.text,
        tipo: question.type,
        respuestaEstudiante: answer,
        esCorrecta: isCorrect,
        puntosObtenidos: pointsEarned,
        opciones: question.options?.map(o => ({ id: o.id, texto: o.text, esCorrecta: o.isCorrect }))
      });

      return {
        questionId: question.id,
        answer: answer || '',
        isCorrect,
        pointsEarned,
      };
    });

    const totalPoints = questionAnswers.reduce((sum, ans) => sum + (ans.pointsEarned || 0), 0);
    // Calcular nota en escala vigesimal peruana (0-20)
    const grade = Math.round((totalPoints / this.quiz.totalPoints) * 200) / 10; // Redondear a 1 decimal
    const percentage = grade; // Mantener compatibilidad con código existente
    const passed = grade >= 10.5; // Aprobado en sistema peruano: >= 10.5

    const correctCount = questionAnswers.filter(a => a.isCorrect === true).length;
    const incorrectCount = questionAnswers.filter(a => a.isCorrect === false).length;
    console.log(`📊 Resumen: ${correctCount} correctas, ${incorrectCount} incorrectas de ${this.quiz.questions.length} preguntas`);
    console.log(`🎯 Nota: ${grade}/20 (${totalPoints}/${this.quiz.totalPoints} puntos) - ${passed ? '✅ APROBADO' : '❌ DESAPROBADO'}`);

    const studentId = this.authService.getUserId();
    if (!studentId) {
      console.error('❌ No se pudo obtener el ID del estudiante. No se puede enviar la evaluación.');
      this.isSubmitting.set(false);
      return;
    }

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizId: this.quiz.id,
      studentId: studentId,
      attemptNumber: (this.attempt?.attemptNumber || 0) + 1,
      status: 'completed',
      answers: questionAnswers,
      startedAt: this.startTime,
      completedAt: endTime,
      timeSpent,
      score: totalPoints,
      percentage,
      passed,
    };

    console.log('📦 Attempt creado para enviar:', attempt);
    console.log('📋 Número de respuestas en attempt:', attempt.answers.length);
    console.log('🔍 Verificando estructura del attempt:', {
      hasId: !!attempt.id,
      hasAnswers: !!attempt.answers,
      answersLength: attempt.answers?.length,
      firstAnswer: attempt.answers[0]
    });

    this.onSubmit.emit(attempt);
  }

  private checkAnswer(question: Question, answer: string | string[] | undefined): boolean {
    if (!answer) {
      console.log(`❌ Sin respuesta para pregunta ${question.id}`);
      return false;
    }

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        const correctOption = question.options?.find(opt => opt.isCorrect === true);
        const isCorrect = correctOption?.id === answer;
        console.log(`🔍 Verificando ${question.type}:`, {
          respuestaEstudiante: answer,
          opcionCorrecta: correctOption?.id,
          textoOpcionCorrecta: correctOption?.text,
          resultado: isCorrect ? '✅ CORRECTA' : '❌ INCORRECTA'
        });
        return isCorrect;

      case 'short-answer':
        if (typeof answer === 'string' && question.correctAnswer) {
          const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
          console.log(`🔍 Verificando short-answer:`, {
            respuestaEstudiante: answer,
            respuestaCorrecta: question.correctAnswer,
            resultado: isCorrect ? '✅ CORRECTA' : '❌ INCORRECTA'
          });
          return isCorrect;
        }
        console.log(`❌ Respuesta short-answer inválida o sin respuesta correcta definida`);
        return false;

      case 'matching':
        // TODO: Implementar lógica de matching
        console.log(`⚠️ Tipo matching no implementado aún`);
        return false;

      default:
        console.log(`⚠️ Tipo de pregunta desconocido: ${question.type}`);
        return false;
    }
  }

  cancel(): void {
    if (confirm('¿Estás seguro de que quieres salir? Se perderá tu progreso.')) {
      this.stopTimer();
      this.onCancel.emit();
    }
  }
}
