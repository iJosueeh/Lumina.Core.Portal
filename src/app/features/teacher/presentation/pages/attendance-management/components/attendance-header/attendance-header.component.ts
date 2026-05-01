import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceCourse } from '../../../../../domain/models/attendance.model';

@Component({
  selector: 'app-attendance-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-header.component.html',
})
export class AttendanceHeaderComponent {
  courses = input.required<AttendanceCourse[]>();
  selectedCourseId = input.required<string>();
  searchTerm = input<string>('');
  
  courseChange = output<string>();
  searchChange = output<string>();
  onExport = output<void>();
}
