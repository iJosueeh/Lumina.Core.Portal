import { Injectable } from '@angular/core';

export type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'TARDE' | 'JUSTIFICADO';

@Injectable({
  providedIn: 'root',
})
export class AttendanceMapper {
  getStatusColor(status: string): string {
    const s = status.toUpperCase();
    switch (s) {
      case 'PRESENTE': return 'success';
      case 'AUSENTE': return 'error';
      case 'TARDE': return 'warning';
      case 'JUSTIFICADO': return 'info';
      default: return 'info';
    }
  }

  getStatusIcon(status: string): string {
    const s = status.toUpperCase();
    switch (s) {
      case 'PRESENTE': return 'check_circle';
      case 'AUSENTE': return 'cancel';
      case 'TARDE': return 'schedule';
      case 'JUSTIFICADO': return 'assignment_turned_in';
      default: return 'help';
    }
  }

  getAvailableStatuses(): { value: AttendanceStatus; label: string }[] {
    return [
      { value: 'PRESENTE', label: 'Presente' },
      { value: 'AUSENTE', label: 'Ausente' },
      { value: 'TARDE', label: 'Tarde' },
      { value: 'JUSTIFICADO', label: 'Justificado' },
    ];
  }
}
