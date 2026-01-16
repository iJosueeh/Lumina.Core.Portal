import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { CoursesRepository } from '@features/student/domain/repositories/courses.repository';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { CourseGrade } from '@features/student/domain/models/grade.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CoursesMockRepositoryImpl extends CoursesRepository {
  constructor(private http: HttpClient) {
    super();
  }

  override getStudentCourses(studentId: string): Observable<CourseProgress[]> {
    // Cargar calificaciones desde JSON y convertir a CourseProgress
    return this.http.get<CourseGrade[]>('/assets/mock-data/grades/student-grades.json').pipe(
      delay(500),
      map((grades) =>
        grades.map((grade) => ({
          id: grade.id,
          titulo: grade.nombre,
          categoria: 'PROGRAMACIÓN',
          moduloActual: `Progreso: ${grade.avance}%`,
          progreso: grade.avance,
          ultimoAcceso: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          // Usar la imagen del JSON si existe, sino generar una aleatoria (fallback)
          imagenUrl:
            (grade as any).imagenUrl ||
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=400`,
          colorCategoria:
            grade.estado === 'Aprobado' ? 'green' : grade.estado === 'En Riesgo' ? 'red' : 'blue',
        })),
      ),
    );
  }
}
