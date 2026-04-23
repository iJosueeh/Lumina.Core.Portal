import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Assignment } from '@features/student/domain/models/assignment.model';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-upcoming-assignments',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  templateUrl: './upcoming-assignments.component.html',
  styleUrl: './upcoming-assignments.component.css'
})
export class UpcomingAssignmentsComponent {
  @Input({ required: true }) assignments: Assignment[] = [];
  @Input() isLoading = false;
  @Input() limit = 3;
  @Output() viewAll = new EventEmitter<void>();

  getTimeAgo(date: any): string {
    if (!date) return 'Sin fecha';
    const diff = new Date(date).getTime() - new Date().getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 0) return 'Vencida';
    if (hours < 1) return 'Vence pronto';
    if (hours < 24) return `Vence en ${hours}h`;
    return `Vence en ${Math.floor(hours / 24)} días`;
  }
}
