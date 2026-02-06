import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CoursesRepository } from '../../domain/repositories/courses.repository';
import { CourseDetail } from '../../domain/models/course-detail.model';

@Injectable({
    providedIn: 'root'
})
export class GetCourseDetailUseCase {
    constructor(private coursesRepository: CoursesRepository) { }

    execute(courseId: string): Observable<CourseDetail> {
        return this.coursesRepository.getCourseDetail(courseId);
    }
}
