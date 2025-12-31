import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GradesManagementRepository } from '../../domain/repositories/grades-management.repository';
import { StudentGrade } from '../../domain/models/student-grade.model';

@Injectable({
    providedIn: 'root'
})
export class GetCourseGradesUseCase {
    constructor(private repository: GradesManagementRepository) {}

    execute(courseId: string): Observable<StudentGrade[]> {
        return this.repository.getGradesByCourse(courseId);
    }
}
