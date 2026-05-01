import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluacionApi } from '@shared/models/course-management.models';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-course-evaluations',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  templateUrl: './course-evaluations.component.html',
})
export class CourseEvaluationsComponent {
  evaluaciones = input.required<EvaluacionApi[]>();
  isLoading = input<boolean>(false);
  onEdit = output<EvaluacionApi>();
}
