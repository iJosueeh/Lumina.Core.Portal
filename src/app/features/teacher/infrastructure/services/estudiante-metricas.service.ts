import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { EstudianteMetricas, EstudianteMetricasCompletas } from '@features/teacher/domain/models/estudiante-metricas.model';

interface TareasEstudianteResponse {
  tareasEntregadas: number;
  tareasPendientes: number;
  tareasTotal: number;
}

interface AulaVirtualProgressBatchItem {
  estudianteId: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonId: string | null;
  lastActivityAt: string | null;
}

/**
 * Servicio para obtener métricas de estudiantes desde múltiples APIs.
 * No genera datos mock — cuando el backend falla retorna 0 / vacío.
 */
@Injectable({ providedIn: 'root' })
export class EstudianteMetricasService {
  private http = inject(HttpClient);
  private evaluacionesApiUrl = `${environment.evaluacionesApiUrl}/evaluaciones`;
  private estudiantesApiUrl = environment.estudiantesApiUrl;

  /**
   * Obtiene el promedio y estadísticas de evaluaciones de un estudiante
   */
  getPromedioEstudiante(estudianteId: string): Observable<EstudianteMetricas> {
    return this.http.get<EstudianteMetricas>(
      `${this.evaluacionesApiUrl}/estudiante/${estudianteId}/promedio`
    ).pipe(
      catchError(error => {

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
   * Obtiene el conteo de tareas (entregadas y pendientes) de un estudiante
   */
  getTareasEstudiante(estudianteId: string): Observable<TareasEstudianteResponse> {
    return this.http.get<TareasEstudianteResponse>(
      `${this.evaluacionesApiUrl}/estudiantes/${estudianteId}/tareas`
    ).pipe(
      catchError(error => {

        return of({
          tareasEntregadas: 0,
          tareasPendientes: 0,
          tareasTotal: 0
        });
      })
    );
  }

  /**
   * Obtiene el resumen de asistencia de un estudiante en un curso
   */
  getAsistenciaEstudiante(estudianteId: string, cursoId: string): Observable<number> {
    return this.http.get<any>(
      `${this.estudiantesApiUrl}/asistencias/resumen?estudianteId=${estudianteId}&cursoId=${cursoId}`
    ).pipe(
      map(r => r?.porcentajeAsistencia ?? 0),
      catchError(() => of(0))
    );
  }

  /**
   * Obtiene el progreso de aula virtual para múltiples estudiantes de un curso (batch - 1 request).
   */
  getAulaVirtualProgressBatch(cursoId: string, estudianteIds: string[]): Observable<Map<string, number>> {
    if (estudianteIds.length === 0) return of(new Map());
    const idsParam = estudianteIds.join(',');
    return this.http.get<AulaVirtualProgressBatchItem[]>(
      `${this.estudiantesApiUrl}/matricula/aula-virtual-progress/batch?cursoId=${cursoId}&estudianteIds=${idsParam}`
    ).pipe(
      map(results => {
        const map = new Map<string, number>();
        results.forEach(r => map.set(r.estudianteId, r.progressPercent ?? 0));
        return map;
      }),
      catchError(() => of(new Map()))
    );
  }

  /**
   * Obtiene todas las métricas disponibles para un estudiante
   */
  getMetricasCompletas(estudianteId: string, cursoId?: string): Observable<EstudianteMetricasCompletas> {
    return forkJoin({
      evaluaciones: this.getPromedioEstudiante(estudianteId),
      tareas: this.getTareasEstudiante(estudianteId),
    }).pipe(
      switchMap(result => {
        if (!cursoId) {
          return of({
            ...result.evaluaciones,
            tareasEntregadas: result.tareas.tareasEntregadas,
            tareasPendientes: result.tareas.tareasPendientes,
            asistencia: 0,
          });
        }
        return this.getAsistenciaEstudiante(estudianteId, cursoId).pipe(
          map(asistencia => ({
            ...result.evaluaciones,
            tareasEntregadas: result.tareas.tareasEntregadas,
            tareasPendientes: result.tareas.tareasPendientes,
            asistencia,
          }))
        );
      }),
      catchError(() => of({
        estudianteId,
        promedioGeneral: 0,
        totalEvaluaciones: 0,
        evaluacionesCompletadas: 0,
        tareasEntregadas: 0,
        tareasPendientes: 0,
        asistencia: 0,
      }))
    );
  }

  /**
   * Obtiene métricas para múltiples estudiantes en paralelo.
   * Si se proporciona cursoId, incluye asistencia del aula virtual en batch (1 request).
   */
  getMetricasMultiplesEstudiantes(
    estudianteIds: string[],
    cursoId?: string
  ): Observable<Map<string, EstudianteMetricasCompletas>> {
    if (estudianteIds.length === 0) return of(new Map());

    const metricasRequests$ = estudianteIds.map(id =>
      this.getPromedioEstudiante(id).pipe(
        switchMap(metricas =>
          this.getTareasEstudiante(id).pipe(
            map(tareas => ({
              id,
              metricas: {
                ...metricas,
                tareasEntregadas: tareas.tareasEntregadas,
                tareasPendientes: tareas.tareasPendientes,
                asistencia: 0,
              } as EstudianteMetricasCompletas
            }))
          )
        )
      )
    );

    const metricas$: Observable<Map<string, EstudianteMetricasCompletas>> =
      forkJoin(metricasRequests$).pipe(
        map(results => {
          const map = new Map<string, EstudianteMetricasCompletas>();
          results.forEach(({ id, metricas }) => map.set(id, metricas));
          return map;
        })
      );

    if (!cursoId) return metricas$;

    return forkJoin({
      metricas: metricas$,
      aulaVirtual: this.getAulaVirtualProgressBatch(cursoId, estudianteIds),
    }).pipe(
      map(({ metricas, aulaVirtual }) => {
        const combined = new Map<string, EstudianteMetricasCompletas>();
        metricas.forEach((m, id) => {
          combined.set(id, { ...m, asistencia: aulaVirtual.get(id) ?? 0 });
        });
        return combined;
      })
    );
  }
}
