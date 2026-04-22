import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EvaluationMapper {
  mapTipoEnum(tipo: number): string {
    const tipos = ['Examen', 'Práctica', 'Quiz', 'Parcial', 'Final', 'Tarea'];
    return tipos[tipo] || 'Desconocido';
  }

  mapEstadoEnum(estado: number): string {
    const estados = ['Borrador', 'Publicada', 'Cerrada'];
    return estados[estado] || 'Desconocido';
  }

  getEstadoStatus(estado: string): string {
    const map: Record<string, string> = {
      Borrador: 'INACTIVO',
      Publicada: 'ACTIVO',
      Cerrada: 'INACTIVO',
    };
    return map[estado] || 'PENDIENTE';
  }

  getTipoStatus(tipo: string): string {
    const map: Record<string, string> = {
      Examen: 'ACTIVO',
      Práctica: 'PENDIENTE',
      Quiz: 'ACTIVO',
      Parcial: 'ACTIVO',
      Final: 'ACTIVO',
      Tarea: 'PENDIENTE',
    };
    return map[tipo] || 'PENDIENTE';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
