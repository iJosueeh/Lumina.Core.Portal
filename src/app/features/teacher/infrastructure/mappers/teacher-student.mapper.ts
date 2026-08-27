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
  courseId?: string;
  courseName?: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherStudentMapper {
  /**
   * Transforms a backend student to UI format.
   * Falls back to "Sin datos" defaults when backend data is missing.
   */
  toUIModel(
    student: TeacherStudent,
    metricas?: EstudianteMetricasCompletas,
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
      asistencia: metricas?.asistencia ?? 0,
      estado: this.calculateEstudianteStatus(metricas),
      courseId: courseId,
      courseName: courseName ?? 'Sin datos',
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
   * Maps status string to color classes (if not handled by StatusBadge)
   */
  getStatusType(estado: string): 'success' | 'warning' | 'error' | 'info' {
    switch (estado) {
      case 'Activo': return 'success';
      case 'En Riesgo': return 'warning';
      case 'Inactivo': return 'info';
      default: return 'info';
    }
  }
}
