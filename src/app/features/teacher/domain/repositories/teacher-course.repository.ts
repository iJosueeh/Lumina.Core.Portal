import { Observable } from 'rxjs';
import { TeacherCourse, CourseStats } from '../models/teacher-course.model';

export abstract class TeacherCourseRepository {
    abstract getCoursesByTeacher(teacherId: string): Observable<TeacherCourse[]>;
    abstract getCourseById(courseId: string): Observable<TeacherCourse>;
    abstract getCourseStats(courseId: string): Observable<CourseStats>;
    abstract updateCourse(courseId: string, course: Partial<TeacherCourse>): Observable<TeacherCourse>;
}
