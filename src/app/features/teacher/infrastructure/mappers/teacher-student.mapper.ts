import { Injectable } from '@angular/core';
import { TeacherStudent } from '../../domain/models/teacher-student.model';
import { EstudianteMetricasCompletas } from '../../domain/models/estudiante-metricas.model';

export interface CourseStudentUI {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  email: string;
  avatar: string;
  promedio: number;
  asistencia: number;
  tareasEntregadas: number;
  tareasPendientes: number;
  estado: string;
  ultimoAcceso: string;
  courseId?: string;
  courseName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TeacherStudentMapper {
  /**
   * Transforms a backend student to UI format
   */
  toUIModel(
    student: TeacherStudent,
    metricas?: EstudianteMetricasCompletas,
    ultimoAcceso?: string | null,
    courseName?: string
  ): CourseStudentUI {
    const [nombre, ...apellidosArr] = student.nombreCompleto.split(' ');
    const apellidos = apellidosArr.join(' ');
    const courseId = student.cursos[0] || '';

    return {
      id: student.id,
      codigo: student.usuarioId.substring(0, 8).toUpperCase(),
      nombre: nombre,
      apellidos: apellidos,
      email: student.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        student.nombreCompleto
      )}&background=0D8ABC&color=fff`,
      promedio: metricas?.promedioGeneral ?? 0,
      tareasEntregadas: metricas?.tareasEntregadas ?? 0,
      tareasPendientes: metricas?.tareasPendientes ?? 0,
      asistencia: metricas?.asistencia ?? this.generateMockAttendance(student.id),
      estado: this.calculateEstudianteStatus(metricas),
      ultimoAcceso: ultimoAcceso ?? this.generateMockLastAccess(student.id),
      courseId: courseId,
      courseName: courseName ?? 'Cargando...',
    };
  }

  /**
   * Calculates student status based on metrics
   */
  private calculateEstudianteStatus(metricas: EstudianteMetricasCompletas | undefined): string {
    if (!metricas) return 'Activo';

    const promedio = metricas.promedioGeneral;
    const asistencia = metricas.asistencia ?? 100;

    if (promedio < 14 || asistencia < 75) {
      return 'En Riesgo';
    }

    if (promedio === 0 && metricas.evaluacionesCompletadas === 0) {
      return 'Inactivo';
    }

    return 'Activo';
  }

  /**
   * Deterministic mock data generation
   */
  private hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  private generateMockAttendance(id: string): number {
    return 70 + (this.hashCode(id + 'att') % 31);
  }

  private generateMockLastAccess(id: string): string {
    const now = new Date();
    const hoursAgo = this.hashCode(id + 'acc') % 48;
    now.setHours(now.getHours() - hoursAgo);
    return now.toISOString();
  }

  /**
   * Formats "time ago" string
   */
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  /**
   * Maps status string to color classes (if not handled by StatusBadge)
   */
  getStatusType(estado: string): 'success' | 'warning' | 'error' | 'info' {
    switch (estado) {
      case 'Activo':
        return 'success';
      case 'En Riesgo':
        return 'warning';
      case 'Inactivo':
        return 'info';
      default:
        return 'info';
    }
  }
}
