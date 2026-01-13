import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CoursesRepository } from '@features/student/domain/repositories/courses.repository';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { getMockStudentGrades } from '../../../../core/mock-data/student.mock';

@Injectable({
  providedIn: 'root',
})
export class CoursesMockRepositoryImpl extends CoursesRepository {
  override getStudentCourses(studentId: string): Observable<CourseProgress[]> {
    // Convertir CourseGrade a CourseProgress
    const grades = getMockStudentGrades();

    const courseProgress: CourseProgress[] = grades.map((grade) => ({
      id: grade.id,
      titulo: grade.nombre,
      categoria: 'PROGRAMACIÓN', // Categoría por defecto
      moduloActual: `Progreso: ${grade.avance}%`,
      progreso: grade.avance,
      ultimoAcceso: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
      imagenUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=400`,
      colorCategoria:
        grade.estado === 'Aprobado' ? 'green' : grade.estado === 'En Riesgo' ? 'red' : 'blue',
    }));

    // Simular delay de API
    return of(courseProgress).pipe(delay(500));
  }
}
