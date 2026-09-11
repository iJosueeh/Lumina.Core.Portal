import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluacionApi } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-evaluations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-evaluations.component.html',
})
export class CourseEvaluationsComponent {
  evaluaciones = input.required<EvaluacionApi[]>();
  isLoading = input<boolean>(false);
  onEdit = output<EvaluacionApi>();
  onConfig = output<EvaluacionApi>();
}
