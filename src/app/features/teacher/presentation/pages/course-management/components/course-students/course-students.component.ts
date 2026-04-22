import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseStudent } from '@shared/models/course-management.models';
import { StatusBadgeComponent } from '../../../../../../../shared/components/ui/status-badge/status-badge.component';
import { ButtonComponent } from '../../../../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, ButtonComponent],
  templateUrl: './course-students.component.html',
  styleUrl: './course-students.component.css'
})
export class CourseStudentsComponent {
  students = input.required<CourseStudent[]>();
  onAssignStudent = output<void>();
  onRemoveStudent = output<string>();

  getStudentStatusColor(estado: string): string {
    const s = estado.toUpperCase();
    if (s === 'ACTIVO') return 'ACTIVO';
    if (s === 'EN RIESGO') return 'PENDIENTE'; // Mapper to shared status
    return 'INACTIVO';
  }
}
