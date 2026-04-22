import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizSummary } from '../../../../../domain/models/course-detail.model';

@Component({
  selector: 'app-course-evaluations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-evaluations.component.html',
  styleUrl: './course-evaluations.component.css'
})
export class CourseEvaluationsComponent {
  quizzes = input.required<QuizSummary[]>();
  
  onStartQuiz = output<QuizSummary>();
  onViewResults = output<QuizSummary>();

  quizFilter = signal<'all' | 'pending' | 'completed'>('all');

  filteredQuizzes = computed(() => {
    const list = this.quizzes();
    const filter = this.quizFilter();
    
    if (filter === 'all') return list;
    return list.filter(q => q.status === filter);
  });

  completedQuizzesCount = computed(() => 
    this.quizzes().filter(q => q.status === 'completed').length
  );

  averageQuizScore = computed(() => {
    const completed = this.quizzes().filter(q => q.status === 'completed');
    if (completed.length === 0) return 0;
    
    const sum = completed.reduce((acc, q) => acc + (q.bestScore || 0), 0);
    return sum / completed.length;
  });

  getQuizStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completada';
      case 'expired': return 'Vencida';
      case 'pending': return 'Pendiente';
      default: return 'No disponible';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'Básica';
      case 'medium': return 'Intermedia';
      case 'hard': return 'Avanzada';
      default: return difficulty;
    }
  }

  setFilter(filter: 'all' | 'pending' | 'completed'): void {
    this.quizFilter.set(filter);
  }
}
