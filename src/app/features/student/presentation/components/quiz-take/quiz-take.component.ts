import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quiz, QuizAttempt, Question, QuestionAnswer } from '@features/student/domain/models/quiz.model';
import { AuthService } from '@core/services/auth.service';
import { EnrollmentService } from '@features/student/infrastructure/services/enrollment.service';

@Component({
  selector: 'app-quiz-take',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-take.component.html',
  styles: [`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(-8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .modal-container { animation: fadeIn 200ms ease-out; }
    .modal-card { animation: modalIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1); }
  `]
})
export class QuizTakeComponent implements OnInit, OnDestroy {
  @Input() quiz!: Quiz;
  @Input() attempt?: QuizAttempt;
  @Output() onSubmit = new EventEmitter<QuizAttempt>();
  @Output() onCancel = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private enrollmentService: EnrollmentService
  ) {}

  currentQuestionIndex = signal(0);
  answers = signal<Map<string, string | string[]>>(new Map());
  timeRemaining = signal<number>(0);
  isSubmitting = signal(false);
  showConfirmDialog = signal(false);
  showExitDialog = signal(false);

  private timerInterval?: number;
  private startTime: Date = new Date();

  currentQuestion = computed(() => {
    if (!this.quiz?.questions || this.quiz.questions.length === 0) return null;
    return this.quiz.questions[this.currentQuestionIndex()];
  });

  progress = computed(() => {
    if (!this.quiz?.questions || this.quiz.questions.length === 0) return 0;
    return (Array.from(this.answers().keys()).length / this.quiz.questions.length) * 100;
  });

  answeredCount = computed(() => Array.from(this.answers().keys()).length);

  canGoNext = computed(() =>
    !!this.quiz?.questions && this.currentQuestionIndex() < this.quiz.questions.length - 1
  );

  canGoPrevious = computed(() => this.currentQuestionIndex() > 0);

  isLastQuestion = computed(() =>
    !!this.quiz?.questions && this.currentQuestionIndex() === this.quiz.questions.length - 1
  );

  ngOnInit(): void {
    if (this.attempt) {
      const answersMap = new Map<string, string | string[]>();
      this.attempt.answers.forEach(ans => answersMap.set(ans.questionId, ans.answer));
      this.answers.set(answersMap);
    }
    if (this.quiz.config.timeLimit) {
      this.timeRemaining.set(this.quiz.config.timeLimit * 60);
      this.startTimer();
    }
  }

  ngOnDestroy(): void { this.stopTimer(); }

  private startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      if (this.timeRemaining() > 0) {
        this.timeRemaining.set(this.timeRemaining() - 1);
      } else {
        this.stopTimer();
        this.submitQuiz();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = undefined; }
  }

  getTimerDisplay(): string {
    const s = this.timeRemaining();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  getTimerColor(): string {
    const pct = this.timeRemaining() / ((this.quiz.config.timeLimit || 0) * 60) * 100;
    if (pct > 50) return 'text-green-500';
    if (pct > 25) return 'text-yellow-500';
    return 'text-red-500';
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.quiz.questions.length) this.currentQuestionIndex.set(index);
  }
  nextQuestion(): void { if (this.canGoNext()) this.currentQuestionIndex.update(i => i + 1); }
  previousQuestion(): void { if (this.canGoPrevious()) this.currentQuestionIndex.update(i => i - 1); }

  onAnswerChange(questionId: string, answer: string | string[]): void {
    const newAnswers = new Map(this.answers());
    newAnswers.set(questionId, answer);
    this.answers.set(newAnswers);
  }

  isQuestionAnswered(questionId: string): boolean { return this.answers().has(questionId); }
  getCurrentAnswer(): string | string[] | undefined {
    return this.currentQuestion() ? this.answers().get(this.currentQuestion()!.id) : undefined;
  }

  confirmSubmit(): void { this.showConfirmDialog.set(true); }
  cancelSubmit(): void { this.showConfirmDialog.set(false); }
  requestCancel(): void { if (!this.isSubmitting()) this.showExitDialog.set(true); }
  dismissCancel(): void { this.showExitDialog.set(false); }

  submitQuiz(): void {
    this.isSubmitting.set(true);
    this.stopTimer();
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - this.startTime.getTime()) / 60000);

    const questionAnswers: QuestionAnswer[] = this.quiz.questions.map(q => {
      const answer = this.answers().get(q.id);
      return { questionId: q.id, answer: answer || '', isCorrect: this.checkAnswer(q, answer), pointsEarned: 0 };
    });

    const totalPoints = questionAnswers.reduce((sum, ans) => sum + (ans.pointsEarned || 0), 0);
    const grade = Math.round((totalPoints / this.quiz.totalPoints) * 200) / 10;
    const percentage = grade;
    const passed = grade >= 10.5;

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizId: this.quiz.id,
      studentId: '',
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
        return question.options?.find(o => o.isCorrect)?.id === answer;
      case 'short-answer':
        return typeof answer === 'string' && question.correctAnswer
          ? answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
          : false;
      default: return false;
    }
  }

  cancel(): void {
    this.showExitDialog.set(false);
    this.stopTimer();
    this.onCancel.emit();
  }
}
