import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';

@Injectable({
  providedIn: 'root'
})
export class AdminCourseService {
  private http = inject(HttpClient);
  private readonly cursosApiUrl = environment.cursosApiUrl;
  private readonly docentesApiUrl = environment.docentesApiUrl;

  getCourses(): Observable<AdminCourse[]> {
    return this.http.get<any>(`${this.cursosApiUrl}/cursos/system/all`).pipe(
      map(response => {
        console.log('📡 [ADMIN-COURSE-SERVICE] Raw API Response:', response);
        const data = response?.value || response || [];
        const courses = (Array.isArray(data) ? data : []).map((c: any) => this.mapCourse(c));
        console.log('📚 [ADMIN-COURSE-SERVICE] Mapped Data Count:', courses.length);
        return courses;
      }),
      catchError((err) => {
        console.error('❌ [ADMIN-COURSE-SERVICE] Error fetching courses:', err);
        return of([]);
      })
    );
  }

  getAdminClassroom(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.cursosApiUrl}/cursos/${courseId}/classroom`);
  }

  saveClassroom(courseId: string, sections: any[]): Observable<any> {
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
            id: s.id, 
            titulo: s.title,
            descripcion: s.description || '',
            lecciones: s.videos.map((v: any) => ({
                id: v.lessonId, 
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

  getDocentes(): Observable<AdminDocente[]> {
    return this.http.get<any>(`${this.docentesApiUrl}/docente/system/all`).pipe(
      map(response => {
        const data = response?.value || response || [];
        return data.map((d: any) => ({
          id: this.flattenId(d.id || d.Id),
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
    return this.http.post<{url: string}>(`${this.cursosApiUrl}/upload`, formData).pipe(
      map(res => res.url)
    );
  }

  private flattenId(id: any): string {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id.value) return id.value;
    return String(id);
  }

  private mapCourse(c: any): AdminCourse {
    let mappedStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' = 'DRAFT';
    const rawStatus = (c.estadoCurso || c.EstadoCurso || '').toLowerCase();
    
    if (rawStatus === 'activo' || rawStatus === 'publicado' || rawStatus === 'published') {
        mappedStatus = 'PUBLISHED';
    } else if (rawStatus === 'borrador' || rawStatus === 'draft') {
        mappedStatus = 'DRAFT';
    } else if (rawStatus === 'archivado' || rawStatus === 'archived') {
        mappedStatus = 'ARCHIVED';
    }

    return {
      id: this.flattenId(c.id || c.Id),
      name: c.titulo || c.Titulo || c.nombreRaw || c.NombreCurso || 'Curso sin título',
      code: c.codigo || c.Codigo || 'GEN-001',
      instructorId: this.flattenId(c.instructorId || c.InstructorId) || null,
      teacherName: 'Cargando...', 
      status: mappedStatus,
      description: c.descripcionRaw || c.descripcion || c.Descripcion || '',
      capacity: c.capacidadRaw || c.capacidad || c.Capacidad || 0,
      ciclo: c.ciclo || c.Ciclo || 'N/A',
      creditos: c.creditos || c.Creditos || 0,
      coverImage: c.imagenUrl || c.imagen || c.Imagen || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
      modules: Array.isArray(c.modulos || c.Modulos) ? (c.modulos || c.Modulos).map((m: any, i: number) => ({
        id: this.flattenId(m.id || m.Id),
        titulo: m.titulo || m.Titulo || `Módulo ${i+1}`,
        orden: i + 1
      })) : [],
      evaluaciones: []
    };
  }
}
