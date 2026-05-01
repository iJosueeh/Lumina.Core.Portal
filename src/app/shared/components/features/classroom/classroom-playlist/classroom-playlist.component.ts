import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

export interface ClassroomLesson {
  lessonId: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  videoUrl?: string;
  resources?: any[];
}

export interface ClassroomSection {
  title: string;
  videos: ClassroomLesson[];
}

@Component({
  selector: 'app-classroom-playlist',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './classroom-playlist.component.html',
  styleUrl: './classroom-playlist.component.css'
})
export class ClassroomPlaylistComponent {
  sections = input.required<ClassroomSection[]>();
  activeLessonId = input<string | null>(null);
  isEditable = input<boolean>(false); // Nuevo: Habilita botones de edición

  onLessonSelect = output<ClassroomLesson>();
  onToggleCompletion = output<ClassroomLesson>();
  
  // Eventos de edición para el Admin
  onEditLesson = output<ClassroomLesson>();
  onAddLesson = output<string>(); // Recibe el título de la sección
  onDeleteLesson = output<string>(); // Recibe el lessonId
  onReorderLessons = output<ClassroomSection[]>();

  expandedSections = signal<Record<string, boolean>>({});

  toggleSection(title: string): void {
    const current = this.expandedSections();
    this.expandedSections.set({
      ...current,
      [title]: !current[title]
    });
  }

  isSectionExpanded(title: string): boolean {
    return this.expandedSections()[title] !== false;
  }
}
