import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherCourseDetail } from '@shared/models/course-management.models';
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-course-stats',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './course-stats.component.html',
})
export class CourseStatsComponent {
  course = input.required<TeacherCourseDetail>();
  totalLecciones = input.required<number>();
}
