import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GradesManagementRepository } from '../../domain/repositories/grades-management.repository';
import { GradeInput } from '../../domain/models/student-grade.model';

@Injectable({
    providedIn: 'root'
})
export class SubmitGradeUseCase {
    constructor(private repository: GradesManagementRepository) {}

    execute(gradeInput: GradeInput): Observable<void> {
        return this.repository.submitGrade(gradeInput);
    }
}
