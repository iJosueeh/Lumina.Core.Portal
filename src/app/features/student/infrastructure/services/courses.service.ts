import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { CursoConHorarios } from '@features/student/domain/models/horario.model';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.cursosApiUrl}/cursos`;

  /**
   * Obtiene todos los cursos disponibles
   */
  getAllCourses(): Observable<{ id: string; titulo: string; imagen: string }[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((cursos) =>
        cursos.map((curso) => ({
          id: curso.id,
          titulo: curso.nombreCurso || curso.titulo,
          imagen: curso.imagen || curso.imagenUrl || 'https://via.placeholder.com/400x250?text=Curso',
        })),
      ),
      catchError((error) => {
        console.error('Error loading courses:', error);
        return of([]);
      }),
    );
  }

  /**
   * Obtiene el detalle de un curso incluyendo sus horarios
   */
  getCourseById(id: string): Observable<CursoConHorarios | null> {
    return this.http.get<CursoConHorarios>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error loading course ${id}:`, error);
        return of(null);
      }),
    );
  }

  /**
   * Obtiene todos los cursos con sus horarios
   */
  getAllCoursesWithSchedules(): Observable<CursoConHorarios[]> {
    return this.getAllCourses().pipe(
      switchMap((cursos) => {
        if (cursos.length === 0) {
          return of([]);
        }
        // Para cada curso, obtener su detalle con horarios
        const cursosDetalle$ = cursos.map((curso) => this.getCourseById(curso.id));
        return forkJoin(cursosDetalle$);
      }),
      map((cursosConDetalles) => cursosConDetalles.filter((c) => c !== null) as CursoConHorarios[]),
      catchError((error) => {
        console.error('Error loading courses with schedules:', error);
        return of([]);
      }),
    );
  }
}
