import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CoursesRepository } from '@features/student/domain/repositories/courses.repository';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';

@Injectable({
    providedIn: 'root'
})
export class GetStudentCoursesUseCase {
    constructor(private coursesRepository: CoursesRepository) { }

    execute(studentId: string): Observable<CourseProgress[]> {
        return this.coursesRepository.getStudentCourses(studentId);
    }
}
