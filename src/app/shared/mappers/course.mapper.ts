import { Injectable } from '@angular/core';
import { 
  Modulo, 
  Leccion, 
  ModuloMaterial, 
  CourseStudent 
} from '../models/course-management.models';
import { TeacherStudent } from '@features/teacher/domain/models/teacher-student.model';

@Injectable({
  providedIn: 'root'
})
export class CourseMapper {
  
  mapApiModuloToModulo(m: any, index: number): Modulo {
    const lecciones: Leccion[] = (m.lecciones || []).map(
      (titulo: string, i: number) => ({
        id: `${m.id || index}-${i}`,
        titulo,
        tipo: 'lectura' as const,
        duracion: '30 min',
        completada: false,
      }),
    );

    const materialesRaw = m.materiales ?? m.Materiales ?? m.materials ?? [];
    const materiales: ModuloMaterial[] = Array.isArray(materialesRaw)
      ? materialesRaw
          .map((mat: any, materialIndex: number) => ({
            id: String(mat.id ?? mat.Id ?? `${m.id || index}-mat-${materialIndex}`),
            titulo: String(
              mat.titulo ?? mat.Titulo ?? mat.nombreOriginal ?? mat.NombreOriginal ?? 'Material'
            ),
            tipo: String(mat.tipo ?? mat.Tipo ?? mat.tipoArchivo ?? mat.TipoArchivo ?? 'archivo'),
            url: String(mat.url ?? mat.Url ?? ''),
          }))
          .filter((mat: ModuloMaterial) => !!mat.url)
      : [];

    return {
      id: m.id || String(index + 1),
      orden: index + 1,
      titulo: m.titulo || `Módulo ${index + 1}`,
      descripcion: m.descripcion || '',
      duracion: `${Math.max(lecciones.length, 1) * 30} min`,
      materiales,
      completado: false,
      porcentajeCompletado: 0,
      lecciones,
    };
  }

  mapTeacherStudentToCourseStudent(s: TeacherStudent): CourseStudent {
    const partes = s.nombreCompleto.trim().split(' ');
    const nombre = partes[0] || s.nombreCompleto;
    const apellidos = partes.slice(1).join(' ');
    const avatarName = encodeURIComponent(s.nombreCompleto.trim() || 'Estudiante');
    
    return {
      id: s.id,
      codigo: s.email || s.usuarioId.slice(0, 8).toUpperCase(),
      nombre,
      apellidos,
      email: s.email,
      avatar: `https://ui-avatars.com/api/?name=${avatarName}&background=0d9488&color=fff&size=128&bold=true`,
      promedio: 0,
      asistencia: 0,
      tareasEntregadas: 0,
      tareasPendientes: 0,
      estado: 'Activo',
      ultimoAcceso: new Date().toISOString(),
    };
  }
}
