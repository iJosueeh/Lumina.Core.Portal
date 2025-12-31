import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GradesRepository } from '@features/student/domain/repositories/grades.repository';
import { GradeStats } from '@features/student/domain/models/grade.model';

@Injectable({
    providedIn: 'root'
})
export class GetGradeStatsUseCase {
    constructor(private gradesRepository: GradesRepository) { }

    execute(studentId: string): Observable<GradeStats> {
        return this.gradesRepository.getGradeStats(studentId);
    }
}
