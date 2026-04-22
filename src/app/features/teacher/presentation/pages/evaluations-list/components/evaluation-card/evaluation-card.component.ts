import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationMapper } from '../../../../../infrastructure/mappers/evaluation.mapper';
import { StatusBadgeComponent } from '../../../../../../../shared/components/ui/status-badge/status-badge.component';

import { EvaluacionUI } from '@features/teacher/domain/models/evaluation.model';

@Component({
  selector: 'app-evaluation-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './evaluation-card.component.html',
  styleUrl: './evaluation-card.component.css'
})
export class EvaluationCardComponent {
  evaluation = input.required<EvaluacionUI>();
  
  onViewDetails = output<string>();
  onDelete = output<{ id: string, event: Event }>();

  private mapper = inject(EvaluationMapper);

  getStatus(estado: string) {
    return this.mapper.getEstadoStatus(estado);
  }

  getTipoStatus(tipo: string) {
    return this.mapper.getTipoStatus(tipo);
  }

  formatDate(date: string) {
    return this.mapper.formatDate(date);
  }
}
