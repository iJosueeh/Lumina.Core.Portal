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
    return this.http.get<any>(`${this.cursosApiUrl}/cursos/system/all`).pipe(
      map(response => {
        const data = response?.value || response || [];
        return data.map((c: any) => this.mapCourse(c));
      }),
      catchError((err) => {
        console.error('❌ Error fetching courses:', err);
        return of([]);
      })
    );
  }

  getAdminClassroom(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.cursosApiUrl}/cursos/${courseId}/classroom`);
  }

  saveClassroom(courseId: string, sections: any[]): Observable<any> {
    // Sincronizamos con ActualizarCursoRequestDto y ModuloRequestDto
    const body = {
        nombre: null, 
        descripcion: null,
        capacidad: null,
        nivel: null,
        duracion: null,
        precio: null,
        imagenUrl: null,
        categoria: null,
        instructorId: null,
        modulos: sections.map(s => ({
            id: s.id, // ID original del módulo
            titulo: s.title,
            descripcion: s.description || '',
            lecciones: s.videos.map((v: any) => ({
                id: v.lessonId, // ID original de la lección
                titulo: v.title,
                duracion: v.duration || '10:00',
                videoUrl: v.videoUrl || ''
            }))
        })),
        requisitos: null,
        codigo: null,
        creditos: null,
        ciclo: null,
        estadoCurso: null
    };
    return this.http.put(`${this.cursosApiUrl}/cursos/${courseId}`, body);
  }

  getDocentes(): Observable<any[]> {
    return this.http.get<any>(`${this.docentesApiUrl}/docente/system/all`).pipe(
      map(response => {
        const data = response?.value || response || [];
        return data.map((d: any) => ({
          id: d.id || d.Id,
          nombreCompleto: d.nombreRaw || d.nombre || 'Sin nombre',
          email: d.email || 'N/A'
        }));
      }),
      catchError(() => of([]))
    );
  }

  getCourseDetail(id: string): Observable<any> {
    return this.http.get<any>(`${this.cursosApiUrl}/cursos/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  uploadVideo(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{url: string}>(`${this.cursosApiUrl}/cursos/upload-video`, formData).pipe(
      map(res => res.url)
    );
  }

  private mapCourse(c: any) {
    return {
      id: c.id || c.Id,
      name: c.nombreRaw || c.titulo || c.NombreCurso || 'Curso sin título',
      code: c.codigo || 'GEN-001',
      instructorId: c.instructorId || null,
      teacherName: 'Sin asignar', 
      status: c.estadoCurso || 'PUBLISHED',
      coverImage: c.imagenUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
      modules: c.modulosCount || (c.modulos ? c.modulos.length : 0) || 0,
      evaluaciones: []
    };
  }
}
