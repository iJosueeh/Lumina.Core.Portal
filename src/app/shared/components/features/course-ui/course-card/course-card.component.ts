import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SharedCourseDisplayData {
  id: string;
  titulo: string;
  codigo: string;
  coverImage?: string;
  modalidad?: string;
  nivel?: string;
  // Student focused
  progreso?: number;
  // Teacher focused
  totalAlumnos?: number;
  promedioGeneral?: number;
  proximaClase?: string;
}

@Component({
  selector: 'app-shared-course-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css'
})
export class CourseCardComponent {
  data = input.required<SharedCourseDisplayData>();
  role = input<'student' | 'teacher'>('student');
  
  onView = output<string>();

  progressColor = computed(() => {
    const p = this.data().progreso || 0;
    if (p >= 70) return 'bg-teal-500';
    if (p >= 30) return 'bg-orange-500';
    return 'bg-blue-500';
  });

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop';
  }
}
