import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseDetail } from '../../../../../domain/models/course-detail.model';

@Component({
  selector: 'app-course-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-description.component.html',
  styleUrl: './course-description.component.css'
})
export class CourseDescriptionComponent {
  course = input.required<CourseDetail>();

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop';
  }
}
