import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenEstudiante } from '../../../../../domain/models/attendance.model';
import { StatusBadgeComponent } from '../../../../../../../shared/components/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './attendance-table.component.html',
  styleUrl: './attendance-table.component.css'
})
export class AttendanceTableComponent {
  resumen = input.required<ResumenEstudiante[]>();
  
  getAsistenciaColor(porcentaje: number): string {
    if (porcentaje >= 90) return 'text-teal-400';
    if (porcentaje >= 75) return 'text-orange-400';
    return 'text-red-400';
  }

  getStatusColor(pct: number): string {
    if (pct >= 90) return 'ACTIVO';
    if (pct >= 75) return 'PENDIENTE';
    return 'INACTIVO';
  }
}
