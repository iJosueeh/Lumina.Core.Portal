import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-filter.component.html',
})
export class StudentFilterComponent {
  searchTerm = input<string>('');
  selectedCourse = input<string>('all');
  selectedStatus = input<string>('all');
  
  courseOptions = input<{ label: string; value: string }[]>([]);
  
  searchChange = output<string>();
  courseChange = output<string>();
  statusChange = output<string>();
  onExport = output<void>();

  statusOptions = [
    { label: 'Todos los estados', value: 'all' },
    { label: 'Activo', value: 'Activo' },
    { label: 'En Riesgo', value: 'En Riesgo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];
}
