import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AssignmentsRepository } from '@features/student/domain/repositories/assignments.repository';
import { Assignment } from '@features/student/domain/models/assignment.model';

@Injectable({
    providedIn: 'root'
})
export class AssignmentsMockRepositoryImpl extends AssignmentsRepository {

    private mockAssignments: Assignment[] = [
        {
            id: '1',
            titulo: 'Proyecto Final: E-commerce',
            cursoNombre: 'Desarrollo Web Full Stack',
            fechaLimite: new Date(Date.now() + 5 * 60 * 60 * 1000), // Hoy en 5h
            esUrgente: true,
            mes: 'OCT',
            dia: 25
        },
        {
            id: '2',
            titulo: 'Quiz Módulo 3',
            cursoNombre: 'Introducción a Python',
            fechaLimite: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
            esUrgente: false,
            mes: 'OCT',
            dia: 25
        },
        {
            id: '3',
            titulo: 'Laboratorio SQL',
            cursoNombre: 'Bases de Datos SQL',
            fechaLimite: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
            esUrgente: false,
            mes: 'OCT',
            dia: 28
        }
    ];

    override getUpcomingAssignments(studentId: string): Observable<Assignment[]> {
        return of(this.mockAssignments).pipe(delay(400));
    }
}
