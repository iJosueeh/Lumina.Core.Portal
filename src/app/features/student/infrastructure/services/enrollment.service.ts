import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

export interface Enrollment {
  id: string;
  estudianteId: string;
  cursoId: string;
  fechaInscripcion: string;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);
  private readonly estudiantesApiUrl = environment.estudiantesApiUrl;

  /** Verificar si un estudiante ya está matriculado en un curso */
  isEnrolled(studentId: string, courseId: string): Observable<boolean> {
    return this.http.get<any>(`${this.estudiantesApiUrl}/estudiantes/${studentId}/cursos-matriculados`).pipe(
      map((response: any) => {
        const list = response?.value || response || [];
        return Array.isArray(list) && list.some((c: any) => {
          const id = c.id?.value || c.id || c.Id || c.courseId;
          return String(id).toLowerCase() === String(courseId).toLowerCase();
        });
      }),
      catchError(() => of(false))
    );
  }

  /** Matricular estudiante en un curso (inscripción simple) */
  enroll(studentId: string, courseId: string): Observable<any> {
    return this.http.post(`${this.estudiantesApiUrl}/estudiantes/inscripciones`, {
      EstudianteId: studentId,
      CursoId: courseId
    });
  }

  /** Obtener cursos matriculados de un estudiante */
  getEnrolledCourses(studentId: string): Observable<any[]> {
    return this.http.get<any>(`${this.estudiantesApiUrl}/estudiantes/${studentId}/cursos-matriculados`).pipe(
      map(response => response?.value || response || []),
      catchError(() => of([]))
    );
  }

  /** Obtener todos los cursos disponibles (catálogo público) */
  getAllCourses(): Observable<any[]> {
    return this.http.get<any>(`${environment.cursosApiUrl}/cursos/system/all`).pipe(
      map(response => {
        const data = response?.value || response || [];
        return Array.isArray(data) ? data : [];
      }),
      catchError(() => of([]))
    );
  }
}
