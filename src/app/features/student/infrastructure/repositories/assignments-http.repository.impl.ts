import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AssignmentsRepository } from '../../domain/repositories/assignments.repository';
import { Assignment } from '../../domain/models/assignment.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AssignmentsHttpRepositoryImpl implements AssignmentsRepository {
    private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;

    constructor(private http: HttpClient) { }

    getUpcomingAssignments(studentId: string): Observable<Assignment[]> {
        return this.http.get<any[]>(`${this.evaluacionesApiUrl}/Evaluaciones?estudianteId=${studentId}`)
            .pipe(
                map(assignments => assignments
                    .filter(a => new Date(a.fechaLimite) > new Date()) // Solo futuras
                    .map(assignment => {
                        const dueDate = new Date(assignment.fechaLimite);
                        const today = new Date();
                        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        return {
                            id: assignment.id,
                            titulo: assignment.titulo,
                            cursoNombre: assignment.cursoNombre,
                            fechaLimite: dueDate,
                            esUrgente: daysUntil <= 3,
                            mes: dueDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
                            dia: dueDate.getDate()
                        };
                    })
                    .sort((a, b) => a.fechaLimite.getTime() - b.fechaLimite.getTime())
                    .slice(0, 5) // Top 5
                )
            );
    }
}
