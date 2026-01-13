import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GradesRepository } from '../../domain/repositories/grades.repository';
import { CourseGrade, GradeStats } from '../../domain/models/grade.model';
import { getMockStudentGrades, getMockStudentStats } from '../../../../core/mock-data/student.mock';

/**
 * Implementación Mock del repositorio de calificaciones
 * Usa datos estáticos para desarrollo sin backend
 */
@Injectable({
  providedIn: 'root',
})
export class GradesMockRepositoryImpl extends GradesRepository {
  override getGradesByStudent(studentId: string): Observable<CourseGrade[]> {
    // Retornar datos mock
    return of(getMockStudentGrades());
  }

  override getGradeStats(studentId: string): Observable<GradeStats> {
    // Retornar estadísticas mock
    return of(getMockStudentStats());
  }
}
