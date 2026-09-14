import { Injectable } from '@angular/core';
import { Material, MaterialTipo } from '../../features/teacher/presentation/pages/materials-management/materials-management.component';

@Injectable({
  providedIn: 'root'
})
export class MaterialsMapper {

  normalizeTipo(tipo: string): MaterialTipo {
    const t = (tipo || '').toLowerCase();
    if (t.includes('pdf')) return 'PDF';
    if (t.includes('video') || t.includes('mp4') || t.includes('stream')) return 'Video';
    if (t.includes('ppt') || t.includes('present')) return 'Presentación';
    if (t.includes('doc') || t.includes('word') || t.includes('txt') || t.includes('sheet') || t.includes('excel')) return 'Documento';
    if (t.includes('link') || t.includes('enlace') || t.includes('http')) return 'Enlace';
    return 'Documento';
  }

  mapFromBackend(raw: any, course: any, moduloName: string = 'General'): Material {
    const rawType = raw.tipo ?? raw.Tipo ?? raw.tipoArchivo ?? 'PDF';
    const sizeBytes = raw.tamañoBytes ?? raw.tamanoBytes ?? raw.TamañoBytes ?? 0;
    const sizeMB = sizeBytes > 0 
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
      : (raw.tamano || '1.0 MB');

    return {
      id: String(raw.id ?? raw.Id ?? `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      courseId: course.id,
      courseName: course.titulo,
      titulo: raw.titulo ?? raw.Titulo ?? raw.nombreOriginal ?? raw.NombreOriginal ?? 'Material de Clase',
      descripcion: raw.descripcion ?? raw.Descripcion ?? 'Recurso académico',
      tipo: this.normalizeTipo(rawType),
      url: raw.url ?? raw.Url ?? '#',
      tamano: sizeMB,
      fechaSubida: raw.fechaCreacion ?? raw.FechaCreacion ?? new Date().toISOString(),
      modulo: moduloName || 'General',
      descargas: raw.descargas ?? 0
    };
  }
}
