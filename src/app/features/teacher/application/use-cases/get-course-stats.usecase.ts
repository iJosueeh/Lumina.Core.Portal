import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TeacherCourseRepository } from '../../domain/repositories/teacher-course.repository';
import { CourseStats } from '../../domain/models/teacher-course.model';

@Injectable({
    providedIn: 'root'
})
export class GetCourseStatsUseCase {
    constructor(private repository: TeacherCourseRepository) {}

    execute(courseId: string): Observable<CourseStats> {
        return this.repository.getCourseStats(courseId);
    }
}
