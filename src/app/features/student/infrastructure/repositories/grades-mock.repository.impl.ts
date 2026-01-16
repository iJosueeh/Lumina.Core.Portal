import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { GradesRepository } from '@features/student/domain/repositories/grades.repository';
import { CourseGrade, GradeStats } from '@features/student/domain/models/grade.model';
import { HttpClient } from '@angular/common/http';

/**
 * Implementación Mock del repositorio de calificaciones
 * Usa datos estáticos desde JSON para desarrollo sin backend
 */
@Injectable({
  providedIn: 'root',
})
export class GradesMockRepositoryImpl extends GradesRepository {
  constructor(private http: HttpClient) {
    super();
  }

  override getGradesByStudent(studentId: string): Observable<CourseGrade[]> {
    return this.http
      .get<CourseGrade[]>('/assets/mock-data/grades/student-grades.json')
      .pipe(delay(500));
  }

  override getGradeStats(studentId: string): Observable<GradeStats> {
    return this.http.get<GradeStats>('/assets/mock-data/grades/grade-stats.json').pipe(delay(500));
  }
}
