import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseManagementSharedComponent } from '@shared/components/features/course-management/main-view/course-management-shared.component';

@Component({
  selector: 'app-admin-course-detail',
  standalone: true,
  imports: [CommonModule, CourseManagementSharedComponent],
  template: `
    <app-course-management-shared role="admin" />
  `
})
export class AdminCourseDetailComponent {}
