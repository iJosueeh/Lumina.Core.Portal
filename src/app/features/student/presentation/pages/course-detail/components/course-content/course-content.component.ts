import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseDetail, Module, Lesson, CourseMaterial } from '../../../../../domain/models/course-detail.model';

@Component({
  selector: 'app-course-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-content.component.html',
  styleUrl: './course-content.component.css'
})
export class CourseContentComponent {
  course = input.required<CourseDetail>();
  materials = input.required<CourseMaterial[]>();
  
  onToggleLessonCompletion = output<{ event: Event; lesson: Lesson }>();
  onOpenLesson = output<{ module: Module; lesson: Lesson }>();
  onPreviewMaterial = output<CourseMaterial>();
  onContinueLesson = output<void>();

  expandedModules = signal<Set<string>>(new Set());

  toggleModule(module: Module): void {
    this.expandedModules.update(prev => {
      const next = new Set(prev);
      if (next.has(module.id)) {
        next.delete(module.id);
      } else {
        next.add(module.id);
      }
      return next;
    });
  }

  getMaterialsForModule(moduleId: string): CourseMaterial[] {
    return this.materials().filter(m => m.moduleId === moduleId);
  }

  hasMaterialsForModule(moduleId: string): boolean {
    return this.getMaterialsForModule(moduleId).length > 0;
  }

  getMaterialIcon(type: string): string {
    switch (type) {
      case 'pdf': return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
      case 'video': return 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
      case 'link': return 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.103 1.103';
      default: return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop';
  }
}
