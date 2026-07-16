import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherCourseGrades } from '@shared/models/grades-management.models';

@Component({
  selector: 'app-grades-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css'
})
export class GradesFilterBarComponent {
  @Input({ required: true }) courses: TeacherCourseGrades[] = [];
  @Input({ required: true }) selectedCourseId: string = '';
  @Input() searchTerm: string = '';
  @Input() isSaving = false;

  @Output() courseChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
}
