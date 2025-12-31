import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GradesRepository } from '@features/student/domain/repositories/grades.repository';
import { CourseGrade } from '@features/student/domain/models/grade.model';

@Injectable({
    providedIn: 'root'
})
export class GetStudentGradesUseCase {
    constructor(private gradesRepository: GradesRepository) { }

    execute(studentId: string): Observable<CourseGrade[]> {
        return this.gradesRepository.getGradesByStudent(studentId);
    }
}
