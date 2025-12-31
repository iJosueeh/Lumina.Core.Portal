import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TeacherCourseRepository } from '../../domain/repositories/teacher-course.repository';
import { TeacherCourse } from '../../domain/models/teacher-course.model';

@Injectable({
    providedIn: 'root'
})
export class GetTeacherCoursesUseCase {
    constructor(private repository: TeacherCourseRepository) {}

    execute(teacherId: string): Observable<TeacherCourse[]> {
        return this.repository.getCoursesByTeacher(teacherId);
    }
}
