import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminCourseService {
  private http = inject(HttpClient);
  private readonly cursosApiUrl = environment.cursosApiUrl;
  private readonly docentesApiUrl = environment.docentesApiUrl;

  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.cursosApiUrl}/cursos`).pipe(
      map(courses => courses.map(c => this.mapCourse(c))),
      catchError(() => this.http.get<any[]>('/assets/mock-data/courses/admin-courses.json'))
    );
  }

  getCourseDetail(id: string): Observable<any> {
    return this.http.get<any>(`${this.cursosApiUrl}/cursos/${id}`).pipe(
      map(c => this.mapCourseDetail(c)),
      catchError(() => of(null))
    );
  }

  getDocentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.docentesApiUrl}/docentes`).pipe(
      map(data => data.map(d => ({
        id: d.id,
        nombreCompleto: d.nombreCompleto || d.nombre,
        email: d.email
      }))),
      catchError(() => of([]))
    );
  }

  private mapCourse(c: any) {
    return {
      id: c.id ?? c.Id,
      name: c.titulo ?? c.Titulo ?? '',
      code: c.codigo ?? c.Codigo ?? 'N/A',
      instructorId: c.instructorId || null,
      teacherName: c.instructor?.nombre || 'Sin asignar',
      status: c.estadoCurso ?? 'PUBLISHED',
      coverImage: c.imagen || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070',
      modules: [],
      evaluaciones: []
    };
  }

  private mapCourseDetail(c: any) {
    return {
      ...this.mapCourse(c),
      description: c.descripcion || '',
      modules: (c.modulos || []).map((m: any, i: number) => ({
        id: m.id || `module-${i}`,
        title: m.titulo || `Módulo ${i + 1}`,
        description: m.descripcion || ''
      }))
    };
  }
}
