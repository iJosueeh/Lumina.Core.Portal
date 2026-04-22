import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../../ui/status-badge/status-badge.component';

export interface EvaluationDisplayData {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: string;
  estado: string;
  puntajeMaximo: number;
  fechaInicio: string;
  fechaFin: string;
  cursoNombre?: string;
  // Metadata adicional para estudiante
  preguntasCount?: number;
  tiempoLimite?: number;
}

@Component({
  selector: 'app-shared-evaluation-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './evaluation-card.component.html',
  styleUrl: './evaluation-card.component.css'
})
export class EvaluationCardComponent {
  data = input.required<EvaluationDisplayData>();
  role = input<'student' | 'teacher'>('student');
  
  onAction = output<string>(); // Emite el ID para la acción principal
  onSecondaryAction = output<{ id: string, event: Event }>(); // Para eliminar, editar, etc.

  statusColor = computed(() => {
    const s = this.data().estado.toUpperCase();
    if (s === 'PUBLICADA' || s === 'ACTIVO' || s === 'COMPLETADA') return 'ACTIVO';
    if (s === 'BORRADOR' || s === 'PENDIENTE' || s === 'CERRADA' || s === 'VENCIDA') return 'INACTIVO';
    return 'PENDIENTE';
  });

  tipoStatus = computed(() => {
    const t = this.data().tipo.toUpperCase();
    if (['EXAMEN', 'PARCIAL', 'FINAL', 'QUIZ'].includes(t)) return 'ACTIVO';
    return 'PENDIENTE';
  });

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
