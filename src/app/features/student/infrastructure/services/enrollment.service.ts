import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap, shareReplay } from 'rxjs';
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

  // Cache: userId → studentId
  private studentIdCache = new Map<string, string | null>();

  /**
   * Obtiene el estudianteId a partir del usuarioId.
   * Llama a GET /api/estudiantes/by-usuario/{usuarioId}
   */
  getStudentIdByUserId(usuarioId: string): Observable<string | null> {
    // Verificar cache
    if (this.studentIdCache.has(usuarioId)) {
      return of(this.studentIdCache.get(usuarioId));
    }

    return this.http.get<{ id: string }>(
      `${this.estudiantesApiUrl}/estudiantes/by-usuario/${usuarioId}`
    ).pipe(
      map(response => {
        const studentId = response?.id || null;
        this.studentIdCache.set(usuarioId, studentId);
        return studentId;
      }),
      catchError(() => {
        this.studentIdCache.set(usuarioId, null);
        return of(null);
      })
    );
  }

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

  /** Obtener cursos matriculados usando el usuarioId (resuelve automáticamente) */
  getEnrolledCoursesByUserId(usuarioId: string): Observable<any[]> {
    return this.getStudentIdByUserId(usuarioId).pipe(
      switchMap(studentId => {
        if (!studentId) return of([]);
        return this.getEnrolledCourses(studentId);
      })
    );
  }

  /** Obtener cursos disponibles (catálogo público — solo Activo) */
  getAllCourses(): Observable<any[]> {
    return this.http.get<any>(`${environment.cursosApiUrl}/cursos/public`).pipe(
      map(response => {
        const data = response?.value || response || [];
        // Defense-in-depth: filter client-side in case backend returns non-active
        const active = Array.isArray(data)
          ? data.filter((c: any) => {
              const status = (c.estadoCurso || c.EstadoCurso || '').toLowerCase();
              return status === 'activo' || status === 'publicado' || status === 'published';
            })
          : [];
        return active;
      }),
      catchError(() => of([]))
    );
  }
}
