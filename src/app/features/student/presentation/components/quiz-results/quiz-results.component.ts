import { Component, Input, Output, EventEmitter, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quiz, QuizAttempt } from '@features/student/domain/models/quiz.model';

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-results.component.html',
  styles: ``,
})
export class QuizResultsComponent implements OnInit {
  @Input() quiz!: Quiz;
  @Input() attempt!: QuizAttempt;
  @Output() onClose = new EventEmitter<void>();
  @Output() onRetry = new EventEmitter<void>();

  ngOnInit(): void {
    console.log('🎯 QuizResultsComponent inicializado');
    console.log('📝 Quiz recibido:', this.quiz);
    console.log('📊 Attempt recibido:', this.attempt);
    console.log('📋 Answers en attempt:', this.attempt?.answers);
    console.log('🔢 Número de respuestas:', this.attempt?.answers?.length || 0);
    
    if (this.attempt?.answers && this.attempt.answers.length > 0) {
      console.log('✅ Primera respuesta como ejemplo:', this.attempt.answers[0]);
      this.attempt.answers.forEach((ans, idx) => {
        console.log(`  Respuesta ${idx + 1}:`, {
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect: ans.isCorrect,
          pointsEarned: ans.pointsEarned
        });
      });
    } else {
      console.error('❌ NO HAY RESPUESTAS EN EL ATTEMPT');
    }
  }

  // Computed properties
  scorePercentage = computed(() => {
    return this.attempt.percentage || 0;
  });

  passedQuiz = computed(() => {
    return this.attempt.passed || false;
  });

  correctAnswersCount = computed(() => {
    const answers = this.attempt?.answers || [];
    const count = answers.filter(a => a.isCorrect === true).length;
    console.log('📊 Respuestas correctas:', count, 'de', answers.length);
    return count;
  });

  incorrectAnswersCount = computed(() => {
    const answers = this.attempt?.answers || [];
    const count = answers.filter(a => a.isCorrect === false).length;
    console.log('📊 Respuestas incorrectas:', count, 'de', answers.length);
    return count;
  });

  timeSpentDisplay = computed(() => {
    const minutes = this.attempt.timeSpent || 0;
    if (minutes < 1) return 'Menos de 1 minuto';
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  });

  canRetry = computed(() => {
    // TODO: Verificar intentos restantes desde el summary
    return true;
  });

  getScoreColor(): string {
    const percentage = this.scorePercentage();
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 75) return 'text-blue-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }

  getScoreBgColor(): string {
    const percentage = this.scorePercentage();
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getQuestionById(questionId: string) {
    return this.quiz.questions.find(q => q.id === questionId);
  }

  getAnswerText(questionId: string, answer: string | string[]): string {
    const question = this.getQuestionById(questionId);
    if (!question) return 'N/A';

    if (question.type === 'short-answer') {
      return answer as string;
    }

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const option = question.options?.find(opt => opt.id === answer);
      return option?.text || 'N/A';
    }

    return 'N/A';
  }

  getCorrectAnswerText(questionId: string): string {
    const question = this.getQuestionById(questionId);
    if (!question) return 'N/A';

    if (question.type === 'short-answer') {
      return question.correctAnswer || 'N/A';
    }

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options?.find(opt => opt.isCorrect);
      return correctOption?.text || 'N/A';
    }

    return 'N/A';
  }

  close(): void {
    this.onClose.emit();
  }

  retry(): void {
    this.onRetry.emit();
  }
}
