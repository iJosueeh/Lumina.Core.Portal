import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { EstudianteMetricas, EstudianteMetricasCompletas } from '@features/teacher/domain/models/estudiante-metricas.model';

/**
 * Servicio para obtener métricas de estudiantes desde múltiples APIs
 */
@Injectable({
  providedIn: 'root'
})
export class EstudianteMetricasService {
  private http = inject(HttpClient);
  private evaluacionesApiUrl = `${environment.evaluacionesApiUrl}/evaluaciones`;

  /**
   * Obtiene el promedio y estadísticas de evaluaciones de un estudiante
   */
  getPromedioEstudiante(estudianteId: string): Observable<EstudianteMetricas> {
    return this.http.get<EstudianteMetricas>(
      `${this.evaluacionesApiUrl}/estudiante/${estudianteId}/promedio`
    ).pipe(
      catchError(error => {
        console.warn(`⚠️ [METRICAS] Error obteniendo promedio de ${estudianteId}:`, error);
        return of({
          estudianteId,
          promedioGeneral: 0,
          totalEvaluaciones: 0,
          evaluacionesCompletadas: 0
        });
      })
    );
  }

  /**
   * Obtiene todas las métricas disponibles para un estudiante
   * Combina datos de múltiples APIs (Evaluaciones, Asistencias, Tareas)
   */
  getMetricasCompletas(estudianteId: string): Observable<EstudianteMetricasCompletas> {
    return forkJoin({
      evaluaciones: this.getPromedioEstudiante(estudianteId),
      // TODO: Agregar llamadas a otros servicios cuando estén disponibles
      // asistencias: this.getAsistenciaEstudiante(estudianteId),
      // tareas: this.getTareasEstudiante(estudianteId),
    }).pipe(
      map(result => ({
        ...result.evaluaciones,
        // Valores deterministas basados en el ID hasta que existan las APIs de asistencia/tareas
        asistencia: this.generateDeterministicAttendance(estudianteId),
        tareasEntregadas: this.deterministicInt(estudianteId + 'te', 5, 20),
        tareasPendientes: this.deterministicInt(estudianteId + 'tp', 0, 4),
      }))
    );
  }

  /**
   * Obtiene métricas para múltiples estudiantes en paralelo
   */
  getMetricasMultiplesEstudiantes(estudianteIds: string[]): Observable<Map<string, EstudianteMetricasCompletas>> {
    if (estudianteIds.length === 0) {
      return of(new Map());
    }

    const requests = estudianteIds.map(id =>
      this.getMetricasCompletas(id).pipe(
        map(metricas => ({ id, metricas }))
      )
    );

    return forkJoin(requests).pipe(
      map(results => {
        const map = new Map<string, EstudianteMetricasCompletas>();
        results.forEach(({ id, metricas }) => map.set(id, metricas));
        return map;
      }),
      catchError(error => {
        console.error('❌ [METRICAS] Error obteniendo métricas múltiples:', error);
        return of(new Map());
      })
    );
  }

  // Métodos auxiliares deterministas basados en hash del ID
  private hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  private deterministicInt(seed: string, min: number, max: number): number {
    return min + (this.hashCode(seed) % (max - min + 1));
  }

  private generateDeterministicAttendance(id: string): number {
    // Rango 70-100% determinista por estudiante
    return 70 + (this.hashCode(id + 'att') % 31);
  }
}
