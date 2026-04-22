import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { SkeletonLoaderComponent } from '../../../../../../shared/components/ui/skeleton-loader/skeleton-loader.component';
import { CourseCardComponent } from '../../../../../../shared/components/features/course-ui/course-card/course-card.component';
import { EmptyStateComponent } from '../../../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-active-courses-grid',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, CourseCardComponent, EmptyStateComponent],
  templateUrl: './active-courses-grid.component.html',
  styleUrl: './active-courses-grid.component.css'
})
export class ActiveCoursesGridComponent {
  @Input({ required: true }) courses: CourseProgress[] = [];
  @Input() isLoading = false;
  @Output() viewCourse = new EventEmitter<string>();
}
