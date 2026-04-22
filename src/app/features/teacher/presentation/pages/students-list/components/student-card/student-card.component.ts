import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseStudentUI, TeacherStudentMapper } from '../../../../../infrastructure/mappers/teacher-student.mapper';
import { StatusBadgeComponent } from '../../../../../../../shared/components/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './student-card.component.html',
  styleUrl: './student-card.component.css'
})
export class StudentCardComponent {
  student = input.required<CourseStudentUI>();
  onViewDetails = output<string>();

  private mapper = inject(TeacherStudentMapper);

  getStatusType(estado: string) {
    return this.mapper.getStatusType(estado);
  }

  getTimeAgo(timestamp: string) {
    return this.mapper.getTimeAgo(timestamp);
  }
}
