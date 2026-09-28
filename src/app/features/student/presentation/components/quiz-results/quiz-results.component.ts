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
    const answers = this.attempt?.answers || [];
    const questions = this.quiz?.questions || [];

    if (answers.length > 0 && questions.length > 0) {
      const defaultPoints = 20 / questions.length;
      const totalPts = this.quiz.totalPoints && this.quiz.totalPoints > 0
        ? this.quiz.totalPoints
        : questions.reduce((s, q) => s + (q.points || defaultPoints), 0) || 20;

      const earned = answers.reduce((s, a) => {
        if (a.pointsEarned !== undefined && a.pointsEarned > 0) return s + a.pointsEarned;
        if (a.isCorrect) {
          const q = this.getQuestionById(a.questionId);
          return s + (q?.points || defaultPoints);
        }
        return s;
      }, 0);

      if (totalPts > 0) {
        return Math.min(20, Math.max(0, Math.round((earned / totalPts) * 200) / 10));
      }
      const correct = answers.filter(a => a.isCorrect).length;
      return Math.min(20, Math.max(0, Math.round((correct / questions.length) * 200) / 10));
    }

    const rawPercentage = this.attempt?.percentage;
    const rawScore = this.attempt?.score;

    if (rawPercentage !== undefined && rawPercentage >= 0 && rawPercentage <= 20) {
      return rawPercentage;
    }
    if (rawPercentage !== undefined && rawPercentage > 20) {
      return (rawPercentage / 100) * 20;
    }
    if (rawScore !== undefined && rawScore >= 0 && rawScore <= 20) {
      return rawScore;
    }
    return 0;
  });

  gradeAsPercentage = computed(() => (this.scorePercentage() / 20) * 100);

  passingScoreVigesimal = computed(() => {
    const rawPass = this.quiz?.config?.passingScore;
    if (rawPass !== undefined && rawPass > 0 && rawPass <= 20) return rawPass;
    if (rawPass !== undefined && rawPass > 20) return (rawPass / 100) * 20;
    return 10.5;
  });

  passedQuiz = computed(() => {
    const answers = this.attempt?.answers || [];
    if (answers.length > 0) {
      return this.scorePercentage() >= this.passingScoreVigesimal();
    }
    if (this.attempt?.passed !== undefined) {
      return this.attempt.passed;
    }
    return this.scorePercentage() >= this.passingScoreVigesimal();
  });

  correctAnswersCount = computed(() =>
    (this.attempt?.answers || []).filter(a => a.isCorrect === true).length
  );

  incorrectAnswersCount = computed(() =>
    (this.attempt?.answers || []).filter(a => a.isCorrect === false).length
  );

  timeSpentDisplay = computed(() => {
    const minutes = this.attempt?.timeSpent || 0;
    if (minutes < 1) return 'Menos de 1 minuto';
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  });

  canRetry = computed(() => true);

  getQuestionById(questionId: string) {
    return this.quiz?.questions?.find(q => q.id === questionId);
  }

  getAnswerText(questionId: string, answer: string | string[]): string {
    const question = this.getQuestionById(questionId);
    if (!question) return (typeof answer === 'string' && answer ? answer : 'Sin respuesta');
    if (question.type === 'short-answer') return (typeof answer === 'string' && answer ? answer : 'Sin respuesta');
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const answerStr = Array.isArray(answer) ? answer.join(', ') : (answer?.toString() || '');
      const option = question.options?.find(opt =>
        opt.id.toLowerCase() === answerStr.toLowerCase() ||
        opt.text.trim().toLowerCase() === answerStr.trim().toLowerCase()
      );
      return option?.text || (answerStr || 'Sin respuesta');
    }
    return typeof answer === 'string' && answer ? answer : 'Sin respuesta';
  }

  getCorrectAnswerText(questionId: string): string {
    const question = this.getQuestionById(questionId);
    if (!question) return 'N/A';
    if (question.type === 'short-answer') return question.correctAnswer || 'N/A';
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options?.find(opt => opt.isCorrect === true);
      if (correctOption?.text) return correctOption.text;
      if (question.correctAnswer) {
        const optionByCorrectAnswer = question.options?.find(opt =>
          opt.id.toLowerCase() === question.correctAnswer!.toLowerCase() ||
          opt.text.trim().toLowerCase() === question.correctAnswer!.trim().toLowerCase()
        );
        if (optionByCorrectAnswer?.text) return optionByCorrectAnswer.text;
        return question.correctAnswer;
      }
      return 'N/A';
    }
    return 'N/A';
  }

  close(): void { this.onClose.emit(); }
  retry(): void { this.onRetry.emit(); }
}
