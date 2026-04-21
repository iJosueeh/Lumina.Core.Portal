import { Injectable } from '@angular/core';
import { Material, MaterialTipo } from '../../features/teacher/presentation/pages/materials-management/materials-management.component';

@Injectable({
  providedIn: 'root'
})
export class MaterialsMapper {
  
  generateMockMaterials(courses: any[]): Material[] {
    const templatesByCourse = [
      [
        { titulo: 'Introducción al Curso', tipo: 'PDF' as MaterialTipo, modulo: 'Módulo 1', tamano: '2.4 MB', desc: 'Guía de inicio y objetivos del curso' },
        { titulo: 'Slides — Fundamentos', tipo: 'Presentación' as MaterialTipo, modulo: 'Módulo 1', tamano: '8.1 MB', desc: 'Presentación de conceptos fundamentales' },
        { titulo: 'Video Clase 1', tipo: 'Video' as MaterialTipo, modulo: 'Módulo 1', tamano: '45 min', desc: 'Grabación de la primera sesión teórica' },
      ],
      [
        { titulo: 'Syllabus del Curso', tipo: 'PDF' as MaterialTipo, modulo: 'Módulo 1', tamano: '1.1 MB', desc: 'Plan de estudios y cronograma' },
        { titulo: 'Tutorial en Video', tipo: 'Video' as MaterialTipo, modulo: 'Módulo 2', tamano: '32 min', desc: 'Demostración práctica paso a paso' },
      ]
    ];

    const now = new Date();
    const result: Material[] = [];

    courses.forEach((course, idx) => {
      const templates = templatesByCourse[idx % templatesByCourse.length];
      templates.forEach((t, tIdx) => {
        const fecha = new Date(now);
        fecha.setDate(now.getDate() - (idx * 5 + tIdx));
        result.push({
          id: `mat-${course.id.slice(0, 8)}-${tIdx}`,
          courseId: course.id,
          courseName: course.titulo,
          titulo: t.titulo,
          descripcion: t.desc,
          tipo: t.tipo,
          url: '#',
          tamano: t.tamano,
          fechaSubida: fecha.toISOString(),
          modulo: t.modulo,
          descargas: Math.floor(Math.random() * 100)
        });
      });
    });

    return result;
  }
}
