// Path: src/app/features/student/infrastructure/services/attendance.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

interface RegistrarActividadResult {
  registrado: boolean;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);

  /**
   * Registra actividad de aula (video visto, quiz completado, etc.)
   * El backend crea o actualiza un registro de asistencia para ese día.
   */
  registrarActividadAula(
    estudianteId: string,
    cursoId: string,
    tipo: string, // 'Video' | 'Quiz' | 'Recurso' | 'Leccion'
    recurso: string, // lessonId o videoId
    duracionMinutos?: number
  ): Observable<RegistrarActividadResult> {
    return this.http.post<RegistrarActividadResult>(
      `${environment.estudiantesApiUrl}/asistencias/actividad-aula`,
      { estudianteId, cursoId, tipo, recurso, duracionMinutos }
    );
  }
}
