// Path: Lumina.Core.Portal/src/app/features/student/infrastructure/services/student-stats.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

export interface StudentDashboardStats {
  cursosActivos: number;
  evaluacionesPendientes: number;
  promedioGeneral: number;
  horasEstudio: number;
  cursosCompletados: number;
  horasEstudioSemana: number;
  asistenciaTotal: number;
}

@Injectable({ providedIn: 'root' })
export class StudentStatsService {
  private http = inject(HttpClient);
  private readonly estudiantesApiUrl = environment.estudiantesApiUrl;

  /** Obtiene stats reales del backend para el dashboard del estudiante */
  getDashboardStats(estudianteId: string): Observable<StudentDashboardStats> {
    return this.http.get<any>(
      `${this.estudiantesApiUrl}/estudiantes/${estudianteId}/dashboard-stats`
    ).pipe(
      map(response => ({
        cursosActivos: response?.cursosActivos ?? response?.CursosActivos ?? 0,
        evaluacionesPendientes: response?.evaluacionesPendientes ?? response?.EvaluacionesPendientes ?? 0,
        promedioGeneral: response?.promedioGeneral ?? response?.PromedioGeneral ?? 0,
        horasEstudio: response?.horasEstudio ?? response?.HorasEstudio ?? 0,
        cursosCompletados: response?.cursosCompletados ?? response?.CursosCompletados ?? 0,
        horasEstudioSemana: response?.horasEstudioSemana ?? response?.HorasEstudioSemana ?? 0,
        asistenciaTotal: response?.asistenciaTotal ?? response?.AsistenciaTotal ?? 0,
      })),
      catchError(() => of({
        cursosActivos: 0,
        evaluacionesPendientes: 0,
        promedioGeneral: 0,
        horasEstudio: 0,
        cursosCompletados: 0,
        horasEstudioSemana: 0,
        asistenciaTotal: 0,
      }))
    );
  }
}
