import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CourseHeroData {
  id: string;
  titulo: string;
  codigo?: string;
  coverImage?: string;
  duracion?: string;
  modalidad?: string;
  nivel?: string;
  progreso?: number;
  instructor?: {
    nombre: string;
    cargo: string;
    avatar?: string;
  };
}

@Component({
  selector: 'app-course-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-hero.component.html',
  styleUrl: './course-hero.component.css'
})
export class CourseHeroComponent {
  data = input.required<CourseHeroData>();
  role = input<'student' | 'teacher' | 'admin'>('student');
  
  onBack = output<void>();
  onPrimaryAction = output<void>();

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=450&fit=crop';
  }
}
