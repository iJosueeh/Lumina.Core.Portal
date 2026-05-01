import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminCourse } from '@shared/models/admin-course.models';
import { StatusBadgeComponent } from '@shared/components/ui/status-badge/status-badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-course-table',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, ButtonComponent],
  templateUrl: './course-table.component.html',
  styleUrl: './course-table.component.css'
})
export class CourseTableComponent {
  private router = inject(Router);
  
  courses = input.required<AdminCourse[]>();
  
  onEdit = output<AdminCourse>();
  onDelete = output<AdminCourse>();

  editContent(courseId: string): void {
    this.router.navigate(['/admin/course', courseId, 'content']);
  }
}
