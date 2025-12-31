import { Observable } from 'rxjs';
import { Assignment } from '../models/assignment.model';

export abstract class AssignmentsRepository {
    abstract getUpcomingAssignments(studentId: string): Observable<Assignment[]>;
}
