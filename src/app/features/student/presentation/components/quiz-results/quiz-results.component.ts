import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quiz, QuizAttempt } from '@features/student/domain/models/quiz.model';

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-results.component.html',
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
export class QuizResultsComponent {
  @Input() quiz!: Quiz;
  @Input() attempt!: QuizAttempt;
  @Output() onClose = new EventEmitter<void>();
  @Output() onRetry = new EventEmitter<void>();

  scorePercentage = computed(() => {
    const raw = this.attempt.percentage || 0;
    if (raw >= 0 && raw <= 20) return raw;
    const answers = this.attempt.answers || [];
    const questions = this.quiz?.questions || [];
    if (answers.length > 0 && questions.length > 0) {
      const totalPts = questions.reduce((s, q) => s + (q.points || 0), 0);
      const earned = answers.reduce((s, a) => s + (a.pointsEarned || 0), 0);
      if (totalPts > 0) return Math.min(Math.round((earned / totalPts) * 2000) / 100, 20);
      const correct = answers.filter(a => a.isCorrect).length;
      return Math.min((correct / questions.length) * 20, 20);
    }
    return Math.min((raw / 100) * 20, 20);
  });

  gradeAsPercentage = computed(() => (this.scorePercentage() / 20) * 100);

  passedQuiz = computed(() => this.scorePercentage() >= 10.5);

  correctAnswersCount = computed(() =>
    (this.attempt?.answers || []).filter(a => a.isCorrect === true).length
  );

  incorrectAnswersCount = computed(() =>
    (this.attempt?.answers || []).filter(a => a.isCorrect === false).length
  );

  timeSpentDisplay = computed(() => {
    const minutes = this.attempt.timeSpent || 0;
    if (minutes < 1) return 'Menos de 1 minuto';
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  });

  canRetry = computed(() => true);

  getQuestionById(questionId: string) {
    return this.quiz.questions.find(q => q.id === questionId);
  }

  getAnswerText(questionId: string, answer: string | string[]): string {
    const question = this.getQuestionById(questionId);
    if (!question) return 'N/A';
    if (question.type === 'short-answer') return answer as string;
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const option = question.options?.find(opt => opt.id === answer);
      return option?.text || 'N/A';
    }
    return 'N/A';
  }

  getCorrectAnswerText(questionId: string): string {
    const question = this.getQuestionById(questionId);
    if (!question) return 'N/A';
    if (question.type === 'short-answer') return question.correctAnswer || 'N/A';
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options?.find(opt => opt.isCorrect);
      return correctOption?.text || 'N/A';
    }
    return 'N/A';
  }

  close(): void { this.onClose.emit(); }
  retry(): void { this.onRetry.emit(); }
}
