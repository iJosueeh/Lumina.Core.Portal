import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpcomingEvent } from '@features/student/domain/models/calendar-event.model';

type FilterType = 'all' | 'urgent' | 'thisWeek';

@Component({
  selector: 'app-all-tasks-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-tasks-modal.component.html',
  styleUrl: './all-tasks-modal.component.css'
})
export class AllTasksModalComponent {
  @Input() tasks: UpcomingEvent[] = [];
  @Output() close = new EventEmitter<void>();

  activeFilter: FilterType = 'all';

  filters = [
    { label: 'Todas', value: 'all' as FilterType },
    { label: 'Urgentes', value: 'urgent' as FilterType },
    { label: 'Esta Semana', value: 'thisWeek' as FilterType },
  ];

  get filteredTasks(): UpcomingEvent[] {
    if (this.activeFilter === 'all') return this.tasks;
    if (this.activeFilter === 'urgent') return this.tasks.filter((t) => this.isUrgent(t));
    if (this.activeFilter === 'thisWeek') {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return this.tasks.filter((t) => {
        const taskDate = new Date(t.date);
        return taskDate >= now && taskDate <= weekFromNow;
      });
    }
    return this.tasks;
  }

  isUrgent(task: UpcomingEvent): boolean {
    const now = new Date();
    const taskDate = new Date(task.date);
    const daysUntil = Math.ceil((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 2;
  }

  formatDate(date: Date): string {
    const taskDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return taskDate.toLocaleDateString('es-ES', options);
  }
}
