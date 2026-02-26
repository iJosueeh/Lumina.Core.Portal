import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';

export type MaterialTipo = 'PDF' | 'Video' | 'Enlace' | 'Presentación' | 'Documento';

export interface Material {
  id: string;
  courseId: string;
  courseName: string;
  titulo: string;
  descripcion: string;
  tipo: MaterialTipo;
  url: string;
  tamano: string;
  fechaSubida: string;
  modulo: string;
  descargas: number;
}

interface CourseOption {
  id: string;
  titulo: string;
  codigo: string;
}

@Component({
  selector: 'app-materials-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materials-management.component.html',
})
export class MaterialsManagementComponent implements OnInit {
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);

  isLoading = signal(true);
  courses = signal<CourseOption[]>([]);
  selectedCourseId = signal<string>('all');
  searchTerm = signal('');
  selectedTipo = signal<string>('all');
  materials = signal<Material[]>([]);

  // Modal
  showModal = signal(false);
  editingMaterial = signal<Material | null>(null);
  form: Omit<Material, 'id' | 'fechaSubida' | 'descargas'> = this.emptyForm();

  readonly tipos: MaterialTipo[] = ['PDF', 'Video', 'Enlace', 'Presentación', 'Documento'];

  filteredMaterials = computed(() => {
    let items = this.materials();
    const cid = this.selectedCourseId();
    const term = this.searchTerm().toLowerCase();
    const tipo = this.selectedTipo();

    if (cid !== 'all') items = items.filter((m) => m.courseId === cid);
    if (tipo !== 'all') items = items.filter((m) => m.tipo === tipo);
    if (term) items = items.filter((m) =>
      m.titulo.toLowerCase().includes(term) ||
      m.descripcion.toLowerCase().includes(term) ||
      m.modulo.toLowerCase().includes(term)
    );
    return items;
  });

  totalByTipo = computed(() => {
    const counts: Record<string, number> = {};
    for (const m of this.materials()) {
      counts[m.tipo] = (counts[m.tipo] || 0) + 1;
    }
    return counts;
  });

  async ngOnInit(): Promise<void> {
    try {
      const user = this.authRepo.getCurrentUser();
      const userId = user?.id || (user as any)?.sub || '';
      const courses = await this.teacherQuery.getTeacherCourses(userId);
      const opts = courses.map((c) => ({ id: c.id, titulo: c.titulo, codigo: c.codigo }));
      this.courses.set(opts);
      this.materials.set(this.generateMaterials(courses as any[]));
    } catch (err) {
      console.error('❌ [MATERIALS] Error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private generateMaterials(courses: any[]): Material[] {
    const templatesByCourse = [
      [
        { titulo: 'Introducción al Curso', tipo: 'PDF' as MaterialTipo, modulo: 'Módulo 1', tamano: '2.4 MB', desc: 'Guía de inicio y objetivos del curso' },
        { titulo: 'Slides — Fundamentos', tipo: 'Presentación' as MaterialTipo, modulo: 'Módulo 1', tamano: '8.1 MB', desc: 'Presentación de conceptos fundamentales' },
        { titulo: 'Video Clase 1', tipo: 'Video' as MaterialTipo, modulo: 'Módulo 1', tamano: '45 min', desc: 'Grabación de la primera sesión teórica' },
        { titulo: 'Guía de Ejercicios', tipo: 'Documento' as MaterialTipo, modulo: 'Módulo 2', tamano: '1.8 MB', desc: 'Ejercicios prácticos resueltos' },
        { titulo: 'Documentación oficial', tipo: 'Enlace' as MaterialTipo, modulo: 'Módulo 2', tamano: '—', desc: 'Enlace a documentación externa oficial' },
        { titulo: 'Proyecto de ejemplo', tipo: 'PDF' as MaterialTipo, modulo: 'Módulo 3', tamano: '3.2 MB', desc: 'Proyecto de referencia para evaluación final' },
      ],
      [
        { titulo: 'Syllabus del Curso', tipo: 'PDF' as MaterialTipo, modulo: 'Módulo 1', tamano: '1.1 MB', desc: 'Plan de estudios y cronograma' },
        { titulo: 'Slides — Arquitectura', tipo: 'Presentación' as MaterialTipo, modulo: 'Módulo 1', tamano: '6.5 MB', desc: 'Diagramas de arquitectura del sistema' },
        { titulo: 'Tutorial en Video', tipo: 'Video' as MaterialTipo, modulo: 'Módulo 2', tamano: '32 min', desc: 'Demostración práctica paso a paso' },
        { titulo: 'Lecturas recomendadas', tipo: 'Enlace' as MaterialTipo, modulo: 'Módulo 2', tamano: '—', desc: 'Artículos y recursos de apoyo en línea' },
        { titulo: 'Plantilla de Proyecto', tipo: 'Documento' as MaterialTipo, modulo: 'Módulo 3', tamano: '0.9 MB', desc: 'Template para entrega del proyecto final' },
      ],
      [
        { titulo: 'Manual del Estudiante', tipo: 'PDF' as MaterialTipo, modulo: 'Módulo 1', tamano: '4.7 MB', desc: 'Manual completo del curso' },
        { titulo: 'Clase Grabada — Tema 1', tipo: 'Video' as MaterialTipo, modulo: 'Módulo 1', tamano: '55 min', desc: 'Sesión completa grabada' },
        { titulo: 'Ejercicios de Repaso', tipo: 'Documento' as MaterialTipo, modulo: 'Módulo 2', tamano: '1.3 MB', desc: 'Set de ejercicios de práctica' },
        { titulo: 'Slides — Avanzado', tipo: 'Presentación' as MaterialTipo, modulo: 'Módulo 3', tamano: '10.2 MB', desc: 'Temas avanzados y casos de uso' },
        { titulo: 'Repositorio GitHub', tipo: 'Enlace' as MaterialTipo, modulo: 'Módulo 3', tamano: '—', desc: 'Código fuente de ejemplos del curso' },
      ],
    ];

    const now = new Date();
    const result: Material[] = [];

    courses.forEach((course, idx) => {
      const templates = templatesByCourse[idx % templatesByCourse.length];
      templates.forEach((t, tIdx) => {
        const daysAgo = (idx * 7 + tIdx * 2);
        const fecha = new Date(now);
        fecha.setDate(now.getDate() - daysAgo);
        result.push({
          id: `mat-${course.id.slice(0, 8)}-${tIdx}`,
          courseId: course.id,
          courseName: course.titulo,
          titulo: t.titulo,
          descripcion: t.desc,
          tipo: t.tipo,
          url: t.tipo === 'Enlace' ? 'https://docs.example.com' : '#',
          tamano: t.tamano,
          fechaSubida: fecha.toISOString(),
          modulo: t.modulo,
          descargas: Math.floor((idx + 1) * (tIdx + 1) * 7) % 80 + 5,
        });
      });
    });

    return result;
  }

  private emptyForm(): Omit<Material, 'id' | 'fechaSubida' | 'descargas'> {
    return {
      courseId: '',
      courseName: '',
      titulo: '',
      descripcion: '',
      tipo: 'PDF',
      url: '',
      tamano: '',
      modulo: '',
    };
  }

  openAdd(): void {
    this.editingMaterial.set(null);
    this.form = {
      ...this.emptyForm(),
      courseId: this.selectedCourseId() !== 'all' ? this.selectedCourseId() : '',
      courseName: this.courses().find((c) => c.id === this.selectedCourseId())?.titulo ?? '',
    };
    this.showModal.set(true);
  }

  openEdit(m: Material): void {
    this.editingMaterial.set(m);
    this.form = { ...m };
    this.showModal.set(true);
  }

  onCourseFormChange(): void {
    const c = this.courses().find((c) => c.id === this.form.courseId);
    this.form.courseName = c?.titulo ?? '';
  }

  saveModal(): void {
    const editing = this.editingMaterial();
    if (editing) {
      this.materials.update((list) =>
        list.map((m) => (m.id === editing.id ? { ...m, ...this.form } : m))
      );
    } else {
      const newMat: Material = {
        ...this.form,
        id: `mat-user-${Date.now()}`,
        fechaSubida: new Date().toISOString(),
        descargas: 0,
      };
      this.materials.update((list) => [newMat, ...list]);
    }
    this.showModal.set(false);
  }

  deleteMaterial(id: string): void {
    this.materials.update((list) => list.filter((m) => m.id !== id));
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  tipoIcon(tipo: MaterialTipo): string {
    const icons: Record<MaterialTipo, string> = {
      PDF: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      Video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      Enlace: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      Presentación: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      Documento: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[tipo] ?? icons['Documento'];
  }

  tipoColor(tipo: MaterialTipo): string {
    const map: Record<MaterialTipo, string> = {
      PDF: 'bg-red-500/20 text-red-400 border-red-500/30',
      Video: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Enlace: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Presentación: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Documento: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    };
    return map[tipo] ?? map['Documento'];
  }
}

