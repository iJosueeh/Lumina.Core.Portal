export interface GlobalQuizSummary {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  courseColor: string; // Para badge de curso
  dueDate: Date;
  status: 'urgent' | 'upcoming' | 'available' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  bestScore?: number;
  attemptsUsed: number;
  attemptsAllowed: number;
  timeRemaining?: string; // "2 horas", "1 día", etc.
}

export interface GlobalEvaluationsStats {
  totalPending: number;
  totalCompleted: number;
  averageScore: number;
  urgentCount: number;
  upcomingCount: number;
}
