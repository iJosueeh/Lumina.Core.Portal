import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quiz, QuizAttempt, Question, QuestionAnswer } from '@features/student/domain/models/quiz.model';

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
    const index = this.currentQuestionIndex();
    return this.quiz.questions[index];
  });

  progress = computed(() => {
    const total = this.quiz.questions.length;
    const answered = Array.from(this.answers().keys()).length;
    return (answered / total) * 100;
  });

  answeredCount = computed(() => {
    return Array.from(this.answers().keys()).length;
  });

  canGoNext = computed(() => {
    return this.currentQuestionIndex() < this.quiz.questions.length - 1;
  });

  canGoPrevious = computed(() => {
    return this.currentQuestionIndex() > 0;
  });

  isLastQuestion = computed(() => {
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
    return this.answers().get(this.currentQuestion().id);
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

    // Crear QuizAttempt
    const questionAnswers: QuestionAnswer[] = this.quiz.questions.map(question => {
      const answer = this.answers().get(question.id);
      const isCorrect = this.checkAnswer(question, answer);
      const pointsEarned = isCorrect ? question.points : 0;

      return {
        questionId: question.id,
        answer: answer || '',
        isCorrect,
        pointsEarned,
      };
    });

    const totalPoints = questionAnswers.reduce((sum, ans) => sum + (ans.pointsEarned || 0), 0);
    const percentage = Math.round((totalPoints / this.quiz.totalPoints) * 1000) / 10; // Redondear a 1 decimal
    const passed = percentage >= this.quiz.config.passingScore;

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizId: this.quiz.id,
      studentId: 'student-1', // TODO: Get from auth service
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

    this.onSubmit.emit(attempt);
  }

  private checkAnswer(question: Question, answer: string | string[] | undefined): boolean {
    if (!answer) return false;

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        const correctOption = question.options?.find(opt => opt.isCorrect);
        return correctOption?.id === answer;

      case 'short-answer':
        if (typeof answer === 'string' && question.correctAnswer) {
          return answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        }
        return false;

      case 'matching':
        // TODO: Implementar lógica de matching
        return false;

      default:
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
