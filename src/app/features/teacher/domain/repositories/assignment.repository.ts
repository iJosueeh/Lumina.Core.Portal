import { Observable } from 'rxjs';
import { Assignment, AssignmentSubmission, AssignmentInput } from '../models/assignment.model';

export abstract class AssignmentRepository {
    abstract getAssignmentsByCourse(courseId: string): Observable<Assignment[]>;
    abstract getAssignmentById(assignmentId: string): Observable<Assignment>;
    abstract getSubmissions(assignmentId: string): Observable<AssignmentSubmission[]>;
    abstract createAssignment(assignment: AssignmentInput): Observable<Assignment>;
    abstract updateAssignment(assignmentId: string, assignment: Partial<AssignmentInput>): Observable<Assignment>;
    abstract deleteAssignment(assignmentId: string): Observable<void>;
    abstract gradeSubmission(submissionId: string, grade: number, comment?: string): Observable<void>;
}
