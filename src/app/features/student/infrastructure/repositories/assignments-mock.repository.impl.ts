import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AssignmentsRepository } from '@features/student/domain/repositories/assignments.repository';
import { Assignment } from '@features/student/domain/models/assignment.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AssignmentsMockRepositoryImpl extends AssignmentsRepository {
  constructor(private http: HttpClient) {
    super();
  }

  override getUpcomingAssignments(studentId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>('/assets/mock-data/assignments/assignments.json').pipe(
      map((assignments) =>
        assignments.map((a) => ({
          ...a,
          fechaLimite: new Date(a.fechaLimite),
        })),
      ),
      delay(400),
    );
  }
}
