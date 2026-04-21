import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { SkeletonLoaderComponent } from '../../../../../../shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-active-courses-grid',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  templateUrl: './active-courses-grid.component.html',
  styleUrl: './active-courses-grid.component.css'
})
export class ActiveCoursesGridComponent {
  @Input({ required: true }) courses: CourseProgress[] = [];
  @Input() isLoading = false;
  @Output() viewCourse = new EventEmitter<string>();

  getProgressColor(progreso: number): string {
    if (progreso >= 70) return 'bg-blue-500';
    if (progreso >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop';
  }
}
