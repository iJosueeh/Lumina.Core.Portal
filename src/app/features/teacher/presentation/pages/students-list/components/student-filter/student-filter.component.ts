import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../../../shared/components/ui/select/select.component';
import { ButtonComponent } from '../../../../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-student-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, SelectComponent, ButtonComponent],
  templateUrl: './student-filter.component.html',
  styleUrl: './student-filter.component.css'
})
export class StudentFilterComponent {
  searchTerm = model<string>('');
  selectedCourse = model<string>('all');
  selectedStatus = model<string>('all');
  
  courseOptions = input<{ label: string; value: string }[]>([]);
  onExport = output<void>();

  statusOptions = [
    { label: 'Todos los estados', value: 'all' },
    { label: 'Activo', value: 'Activo' },
    { label: 'En Riesgo', value: 'En Riesgo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];
}
