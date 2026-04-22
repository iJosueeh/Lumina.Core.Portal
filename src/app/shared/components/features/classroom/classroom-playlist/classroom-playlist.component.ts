import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ClassroomSection {
  id: string;
  title: string;
  videos: ClassroomLesson[];
}

export interface ClassroomLesson {
  lessonId: string;
  title: string;
  durationSeconds: number;
  isCompleted: boolean;
  isLocked: boolean;
}

@Component({
  selector: 'app-classroom-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-playlist.component.html',
  styleUrl: './classroom-playlist.component.css'
})
export class ClassroomPlaylistComponent {
  sections = input.required<ClassroomSection[]>();
  activeLessonId = input<string | null>(null);
  
  onSelectLesson = output<ClassroomLesson>();
  onToggleCompletion = output<ClassroomLesson>();

  expandedSections = signal<Set<string>>(new Set());

  toggleSection(sectionId: string): void {
    this.expandedSections.update(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
