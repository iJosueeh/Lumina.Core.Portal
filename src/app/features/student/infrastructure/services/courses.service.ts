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
          imagen: curso.imagen || curso.imagenUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
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
    return this.http.get<any[]>(`${this.apiUrl}/public`).pipe(
      map((cursos) => {
        const list = Array.isArray(cursos) ? cursos : (cursos as any)?.value || [];
        return list.map((c: any) => ({
          id: c.id || c.Id,
          titulo: c.titulo || c.Titulo || c.nombreCurso || 'Curso',
          descripcion: c.descripcion || c.Descripcion || '',
          categoria: c.categoria || c.Categoria || 'General',
          duracion: c.duracion || c.Duracion || '0h',
          nivel: c.nivel || c.Nivel || 'General',
          precio: c.precio || c.Precio || 0,
          imagen: c.imagen || c.imagenUrl || '',
          instructor: c.instructor || { nombre: 'Docente Asignado', cargo: 'Instructor', bio: '', avatar: '' },
          modulos: c.modulos || [],
          requisitos: c.requisitos || [],
          testimonios: c.testimonios || [],
          horarios: (c.horarios || c.Horarios || []).map((h: any) => ({
            id: h.id || h.Id,
            diaSemana: h.diaSemana || h.DiaSemana,
            horaInicio: h.horaInicio || h.HoraInicio,
            horaFin: h.horaFin || h.HoraFin,
            ubicacion: h.ubicacion || h.aula || h.Aula || (h.modalidad === 'Virtual' ? 'Plataforma Online' : 'Campus Principal'),
            modalidad: h.modalidad || h.Modalidad || 'Virtual',
            tipoSesion: h.tipoSesion || h.tipo || h.Tipo || 'Clase',
            enlaceVirtual: h.enlaceVirtual || h.enlaceReunion || h.EnlaceReunion
          }))
        }));
      }),
      catchError((error) => {
        console.error('Error loading courses with schedules:', error);
        return of([]);
      }),
    );
  }
}
