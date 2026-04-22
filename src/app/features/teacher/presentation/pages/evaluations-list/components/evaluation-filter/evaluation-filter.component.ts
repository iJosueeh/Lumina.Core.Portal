import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../../../shared/components/ui/select/select.component';

import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';

@Component({
  selector: 'app-evaluation-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, SelectComponent],
  templateUrl: './evaluation-filter.component.html',
  styleUrl: './evaluation-filter.component.css'
})
export class EvaluationFilterComponent {
  searchTerm = model<string>('');
  selectedCourseId = model<string>('all');
  courses = input.required<TeacherCourse[]>();
}
