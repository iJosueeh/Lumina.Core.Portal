import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';

@Component({
  selector: 'app-active-courses-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-courses-grid.component.html',
})
export class ActiveCoursesGridComponent {
  @Input() courses: CourseProgress[] = [];
  @Input() isLoading: boolean = false;
  @Output() onCourseSelect = new EventEmitter<string>();
}
