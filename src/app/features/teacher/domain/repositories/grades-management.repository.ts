import { Observable } from 'rxjs';
import { StudentGrade, GradeInput, BulkGradeInput } from '../models/student-grade.model';

export abstract class GradesManagementRepository {
    abstract getGradesByCourse(courseId: string): Observable<StudentGrade[]>;
    abstract getStudentGrades(courseId: string, studentId: string): Observable<StudentGrade>;
    abstract submitGrade(gradeInput: GradeInput): Observable<void>;
    abstract submitBulkGrades(bulkInput: BulkGradeInput): Observable<void>;
    abstract updateGrade(gradeId: string, grade: GradeInput): Observable<void>;
}
