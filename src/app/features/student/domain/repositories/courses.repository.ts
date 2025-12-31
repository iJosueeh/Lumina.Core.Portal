import { Observable } from 'rxjs';
import { CourseProgress } from '../models/course-progress.model';

export abstract class CoursesRepository {
    abstract getStudentCourses(studentId: string): Observable<CourseProgress[]>;
}
