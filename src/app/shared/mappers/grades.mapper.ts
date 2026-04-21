import { Injectable } from '@angular/core';
import { CalificacionEstudiante, CourseGradesData } from '../models/grades-management.models';

@Injectable({
  providedIn: 'root'
})
export class GradesMapper {
  
  /**
   * Transforma la respuesta cruda de la API en el modelo que la UI de Grados necesita.
   */
  mapApiToGradesData(apiData: any): CourseGradesData {
    return {
      courseId: apiData.id || apiData.courseId || '',
      courseName: apiData.titulo || apiData.courseName || '',
      courseCode: apiData.codigo || apiData.courseCode || '',
      evaluaciones: (apiData.evaluaciones || []).map((e: any) => ({
        id: e.id,
        nombre: e.titulo || e.nombre,
        peso: e.peso || 0,
        tipo: e.tipoEvaluacion || e.tipo || 'Examen'
      })),
      calificaciones: (apiData.estudiantes || []).map((s: any) => this.mapToCalificacionEstudiante(s)),
      estadisticas: {
        promedioGeneral: apiData.stats?.promedio || 0,
        notaMasAlta: apiData.stats?.max || 0,
        notaMasBaja: apiData.stats?.min || 0,
        aprobados: apiData.stats?.aprobados || 0,
        reprobados: apiData.stats?.reprobados || 0,
        enRiesgo: apiData.stats?.enRiesgo || 0,
        totalEstudiantes: (apiData.estudiantes || []).length
      }
    };
  }

  private mapToCalificacionEstudiante(s: any): CalificacionEstudiante {
    return {
      estudianteId: s.id,
      estudianteNombre: s.nombreCompleto || `${s.nombres} ${s.apellidos}`,
      estudianteCodigo: s.codigo || s.email?.split('@')[0] || '',
      notas: s.notas || {}, // Un mapa { evaluacionId: nota }
      promedio: s.promedio || 0,
      estado: s.estado || 'Activo'
    };
  }
}
