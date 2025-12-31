import { Observable } from 'rxjs';
import { CourseGrade, GradeStats } from '../models/grade.model';

export abstract class GradesRepository {
    abstract getGradesByStudent(studentId: string): Observable<CourseGrade[]>;
    abstract getGradeStats(studentId: string): Observable<GradeStats>;
}
