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
  @Input() attemptsUsed?: number;
  @Input() attemptsAllowed?: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onRetry = new EventEmitter<void>();

  maxAttempts = computed(() => {
    if (this.attemptsAllowed !== undefined && this.attemptsAllowed > 0) return this.attemptsAllowed;
    if (this.quiz?.config?.attemptsAllowed !== undefined && this.quiz.config.attemptsAllowed > 0) {
      return this.quiz.config.attemptsAllowed;
    }
    return 3;
  });

  currentAttemptsUsed = computed(() => {
    if (this.attemptsUsed !== undefined && this.attemptsUsed >= 0) return this.attemptsUsed;
    if (this.attempt?.attemptNumber !== undefined && this.attempt.attemptNumber >= 0) {
      return this.attempt.attemptNumber;
    }
    return 1;
  });

  canRetry = computed(() => {
    return this.currentAttemptsUsed() < this.maxAttempts();
  });

  scorePercentage = computed(() => {
    const answers = this.attempt?.answers || [];
    const questions = this.quiz?.questions || [];

    if (answers.length > 0 && questions.length > 0) {
      const hasCustomPoints = questions.some(q => q.points !== undefined && q.points > 0);
      let earned = 0;
      let totalPossible = 0;

      if (hasCustomPoints) {
        for (const q of questions) {
          const qPoints = (q.points !== undefined && q.points > 0) ? q.points : (20 / questions.length);
          totalPossible += qPoints;
          const ans = answers.find(a => a.questionId === q.id);
          if (ans?.isCorrect) {
            earned += (ans.pointsEarned !== undefined && ans.pointsEarned > 0) ? ans.pointsEarned : qPoints;
          }
        }
      } else {
        totalPossible = questions.length;
        earned = answers.filter(a => a.isCorrect === true).length;
      }

      if (totalPossible > 0) {
        const vigesimal = (earned / totalPossible) * 20;
        return Math.min(20, Math.max(0, Math.round(vigesimal * 10) / 10));
      }
    }

    const rawScore = this.attempt?.score;
    const rawPercentage = this.attempt?.percentage;

    if (rawScore !== undefined && rawScore >= 0 && rawScore <= 20) {
      return Math.round(rawScore * 10) / 10;
    }
    if (rawPercentage !== undefined && rawPercentage >= 0 && rawPercentage <= 20) {
      return Math.round(rawPercentage * 10) / 10;
    }
    if (rawPercentage !== undefined && rawPercentage > 20) {
      return Math.round(((rawPercentage / 100) * 20) * 10) / 10;
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
