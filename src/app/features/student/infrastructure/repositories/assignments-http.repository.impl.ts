// Path: src/app/features/student/infrastructure/repositories/assignments-http.repository.impl.ts
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AssignmentsRepository } from '@features/student/domain/repositories/assignments.repository';
import { Assignment } from '@features/student/domain/models/assignment.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface EvaluacionResponse {
  id: string;
  titulo: string;
  cursoId: string;
  cursoNombre: string;
  fechaLimite: string;
  estado: string;
  tipoEvaluacion: string;
  nota?: number | null;
  estadoNota?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AssignmentsHttpRepositoryImpl extends AssignmentsRepository {
  constructor(private http: HttpClient) {
    super();
  }

  override getUpcomingAssignments(studentId: string): Observable<Assignment[]> {
    return this.http.get<EvaluacionResponse[]>(
      `${environment.evaluacionesApiUrl}/evaluaciones?estudianteId=${studentId}`
    ).pipe(
      map((response) => {
        const evs: EvaluacionResponse[] = Array.isArray(response)
          ? response
          : (response as any).evaluaciones ?? [];

        // Filter: exclude completed (estadoNota === 'Completado')
        // and past deadline
        const now = new Date();
        return evs
          .filter(e => {
            if (e.estadoNota === 'Completado') return false;
            if (e.estado === 'Vencido' && e.estadoNota !== 'Completado') return true; // show vencidas
            const fechaLimite = new Date(e.fechaLimite);
            return fechaLimite >= now || e.estado === 'Abierta';
          })
          .map((e) => {
            const fechaLimite = new Date(e.fechaLimite);
            const diffMs = fechaLimite.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const esUrgente = diffHours > 0 && diffHours < 48;

            return {
              id: e.id,
              titulo: e.titulo,
              cursoNombre: e.cursoNombre,
              fechaLimite,
              esUrgente,
              mes: this.getMes(fechaLimite),
              dia: fechaLimite.getDate(),
              estaCompletada: e.estadoNota === 'Completado',
            } as Assignment;
          })
          .sort((a, b) => a.fechaLimite.getTime() - b.fechaLimite.getTime());
      }),
      catchError(() => of([]))
    );
  }

  private getMes(date: Date): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[date.getMonth()];
  }
}
