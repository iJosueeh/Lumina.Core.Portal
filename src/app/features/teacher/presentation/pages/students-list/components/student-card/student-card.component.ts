import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecimalPipe } from '@angular/common';
import { CourseStudentUI } from '@features/teacher/infrastructure/mappers/teacher-student.mapper';
import { StatusBadgeComponent } from '@shared/components/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe, StatusBadgeComponent],
  templateUrl: './student-card.component.html',
})
export class StudentCardComponent {
  readonly student = input.required<CourseStudentUI>();
  readonly onViewDetails = output<string>();

  getTimeAgo(timestamp: string): string {
    if (!timestamp) return 'Sin datos';
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }
}
