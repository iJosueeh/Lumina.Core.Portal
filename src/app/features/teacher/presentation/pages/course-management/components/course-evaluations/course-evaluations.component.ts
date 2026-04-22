import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluacionApi } from '@shared/models/course-management.models';
import { StatusBadgeComponent } from '../../../../../../../shared/components/ui/status-badge/status-badge.component';
import { ButtonComponent } from '../../../../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-course-evaluations-teacher',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, ButtonComponent],
  templateUrl: './course-evaluations.component.html',
  styleUrl: './course-evaluations.component.css'
})
export class CourseEvaluationsComponent {
  evaluaciones = input.required<EvaluacionApi[]>();
  isLoading = input.required<boolean>();
  
  onCreateQuizz = output<void>();
  onEditQuestions = output<{ id: string, titulo: string }>();

  getStatusColor(estado: string): string {
    const s = estado.toUpperCase();
    if (s === 'ACTIVO') return 'ACTIVO';
    if (s === 'PROGRAMADO') return 'PENDIENTE';
    if (s === 'FINALIZADO') return 'INACTIVO';
    return 'PENDIENTE';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
