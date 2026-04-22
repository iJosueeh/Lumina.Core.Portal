import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseDetail } from '../../../../../domain/models/course-detail.model';

@Component({
  selector: 'app-course-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-header.component.html',
  styleUrl: './course-header.component.css'
})
export class CourseHeaderComponent {
  course = input.required<CourseDetail>();
  onBack = output<void>();
  onContinueLesson = output<void>();

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop';
  }
}
