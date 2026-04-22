import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../../../../shared/components/ui/stat-card/stat-card.component';
import { TeacherCourseDetail } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-stats',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './course-stats.component.html',
  styleUrl: './course-stats.component.css'
})
export class CourseStatsComponent {
  course = input.required<TeacherCourseDetail>();
  totalLecciones = input.required<number>();

  pendingEvaluationsCount = computed(() => 
    this.course().evaluaciones.filter((e) => e.estado === 'En Calificación').length
  );
}
