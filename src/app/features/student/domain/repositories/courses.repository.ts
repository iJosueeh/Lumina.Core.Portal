import { Observable } from 'rxjs';
import { CourseProgress } from '../models/course-progress.model';
import { CourseDetail } from '../models/course-detail.model';

export abstract class CoursesRepository {
    abstract getStudentCourses(studentId: string): Observable<CourseProgress[]>;
    abstract getCourseDetail(courseId: string): Observable<CourseDetail>;
}
