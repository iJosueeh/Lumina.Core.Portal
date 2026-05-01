import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenEstudiante, Sesion } from '../../../../../domain/models/attendance.model';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-table.component.html',
})
export class AttendanceTableComponent {
  sesiones = input.required<Sesion[]>();
  resumenEstudiantes = input.required<ResumenEstudiante[]>();
  
  getAsistencia(estudianteId: string, sesionId: string): string {
    const sesion = this.sesiones().find(s => s.id === sesionId);
    if (!sesion) return '';
    
    const asistencia = sesion.asistencias.find(a => a.estudianteId === estudianteId);
    return asistencia ? asistencia.estado : '';
  }
}
