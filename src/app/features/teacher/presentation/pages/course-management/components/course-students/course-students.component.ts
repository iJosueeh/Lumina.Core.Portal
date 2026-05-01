import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseStudent } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-students.component.html',
})
export class CourseStudentsComponent {
  students = input.required<CourseStudent[]>();
}
