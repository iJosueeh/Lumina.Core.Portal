import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssignmentsRepository } from '@features/student/domain/repositories/assignments.repository';
import { Assignment } from '@features/student/domain/models/assignment.model';

@Injectable({
    providedIn: 'root'
})
export class GetUpcomingAssignmentsUseCase {
    constructor(private assignmentsRepository: AssignmentsRepository) { }

    execute(studentId: string): Observable<Assignment[]> {
        return this.assignmentsRepository.getUpcomingAssignments(studentId);
    }
}
