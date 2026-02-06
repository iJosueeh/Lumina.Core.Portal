import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CourseMaterial, MaterialType } from '../../domain/models/course-detail.model';
import { environment } from '../../../../../environments/environment';

interface RecursoResponse {
  id: string;
  titulo: string;
  descripcion: string;
  tipoRecurso: string; // "pdf", "video", "link", "imagen", "documento"
  cursoNombre: string;
  cursoId: string;
  url: string;
  tamanoBytes: number;
  fechaSubida: string;
  subidoPor: string;
  categoria: string;
  esDescargable: boolean;
  numeroDescargas: number;
  iconoUrl: string;
  etiquetas: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MaterialsService {
  private readonly estudiantesApiUrl = environment.estudiantesApiUrl;

  constructor(private http: HttpClient) {}

  getMaterialsByCourse(courseId: string): Observable<CourseMaterial[]> {
    // El endpoint /api/estudiantes/recursos requiere autenticación
    // y devuelve todos los recursos del estudiante
    // Por ahora retornamos un array vacío hasta implementar filtrado por curso
    return this.http.get<RecursoResponse[]>(`${this.estudiantesApiUrl}/estudiantes/recursos`)
      .pipe(
        map(recursos => {
          // Filtrar solo los recursos del curso actual
          const recursosCurso = recursos.filter(r => r.cursoId === courseId);
          return recursosCurso.map(r => this.mapToCourseMaterial(r));
        })
      );
  }

  private mapToCourseMaterial(recurso: RecursoResponse): CourseMaterial {
    return {
      id: recurso.id,
      title: recurso.titulo,
      type: this.mapTipoToMaterialType(recurso.tipoRecurso),
      moduleId: '', // TODO: Obtener de la respuesta si está disponible
      moduleName: recurso.categoria || 'General',
      lessonId: undefined,
      lessonName: undefined,
      description: recurso.descripcion,
      url: recurso.url,
      fileSize: this.formatFileSize(recurso.tamanoBytes),
      duration: undefined,
      isViewed: false,
      uploadDate: new Date(recurso.fechaSubida),
      downloadCount: recurso.numeroDescargas
    };
  }

  private mapTipoToMaterialType(tipo: string): MaterialType {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === 'pdf') return 'pdf';
    if (tipoLower === 'video') return 'video';
    if (tipoLower === 'link') return 'link';
    if (tipoLower === 'codigo' || tipoLower === 'code') return 'code';
    return 'document';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
