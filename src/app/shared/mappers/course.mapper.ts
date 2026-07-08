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
    console.log(`🔍 [CourseMapper] Mapeando módulo raw en índice ${index}:`, m);
    
    if (!m.id && !m.Id && !m._id && !m._Id) {
      console.warn(`⚠️ [CourseMapper] Módulo en índice ${index} no tiene un ID claro:`, m);
    }

    const lecciones: Leccion[] = (m.lecciones || []).map(
      (l: any, i: number) => {
        const isString = typeof l === 'string';
        const lessonId = l.id ?? l.Id ?? l._id ?? l._Id ?? `${m.id || m.Id || m._id || m._Id || index}-${i}`;
        return {
          id: String(lessonId),
          titulo: isString ? l : (l.titulo ?? l.Titulo ?? 'Nueva Lección'),
          tipo: String(l.tipo ?? l.Tipo ?? 'video'),
          duracion: String(l.duracion ?? l.Duracion ?? '15:00'),
          videoUrl: String(l.videoUrl ?? l.VideoUrl ?? ''),
          completada: false,
        };
      },
    );

    const materialesRaw = m.materiales ?? m.Materiales ?? m.materials ?? [];
    const materiales: ModuloMaterial[] = Array.isArray(materialesRaw)
      ? materialesRaw
          .map((mat: any, materialIndex: number) => {
            const matId = mat.id ?? mat.Id ?? mat._id ?? mat._Id ?? `${m.id || m.Id || m._id || m._Id || index}-mat-${materialIndex}`;
            return {
              id: String(matId),
              titulo: String(
                mat.titulo ?? mat.Titulo ?? mat.nombreOriginal ?? mat.NombreOriginal ?? 'Material'
              ),
              tipo: String(mat.tipo ?? mat.Tipo ?? mat.tipoArchivo ?? mat.TipoArchivo ?? 'archivo'),
              url: String(mat.url ?? mat.Url ?? ''),
            };
          })
          .filter((mat: ModuloMaterial) => !!mat.url)
      : [];

    const mappedModulo = {
      id: m.id ?? m.Id ?? m._id ?? m._Id ?? String(index + 1),
      orden: index + 1,
      titulo: m.titulo ?? m.Titulo ?? `Módulo ${index + 1}`,
      descripcion: m.descripcion ?? m.Descripcion ?? '',
      duracion: `${Math.max(lecciones.length, 1) * 30} min`,
      materiales,
      completado: false,
      porcentajeCompletado: 0,
      lecciones,
    };

    console.log(`✅ [CourseMapper] Módulo mapeado:`, mappedModulo);
    return mappedModulo;
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
