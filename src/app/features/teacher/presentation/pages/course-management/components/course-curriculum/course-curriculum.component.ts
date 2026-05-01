import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modulo, ModuloMaterial, Leccion } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-curriculum',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-curriculum.component.html',
  styleUrl: './course-curriculum.component.css'
})
export class CourseCurriculumComponent {
  modulos = input.required<Modulo[]>();
  
  onOpenMaterial = output<ModuloMaterial>();
  onDownloadMaterial = output<ModuloMaterial>();
  onAddContent = output<string>();
  onCreateModule = output<void>();
  onPreviewLesson = output<string>(); // lessonId
  onEditLesson = output<{moduloId: string, leccion: Leccion}>();

  expandedModules = signal<Set<string>>(new Set());

  toggleModule(moduleId: string): void {
    this.expandedModules.update(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  getLeccionIcon(tipo: string): string {
    const icons: Record<string, string> = {
      video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      lectura: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      quiz: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      tarea: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[tipo] || icons['lectura'];
  }
}
