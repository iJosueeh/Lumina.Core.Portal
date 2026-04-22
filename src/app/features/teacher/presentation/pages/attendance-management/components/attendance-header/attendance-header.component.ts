import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceCourse } from '../../../../../domain/models/attendance.model';
import { StatCardComponent } from '../../../../../../../shared/components/ui/stat-card/stat-card.component';
import { SelectComponent } from '../../../../../../../shared/components/ui/select/select.component';
import { InputComponent } from '../../../../../../../shared/components/ui/input/input.component';

@Component({
  selector: 'app-attendance-header',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, SelectComponent, InputComponent],
  templateUrl: './attendance-header.component.html',
  styleUrl: './attendance-header.component.css'
})
export class AttendanceHeaderComponent {
  courses = input.required<AttendanceCourse[]>();
  selectedCourseId = model.required<string>();
  searchTerm = model<string>('');
  
  promedioAsistencia = input<number>(0);
  totalPresentes = input<number>(0);
  totalAusentes = input<number>(0);
  totalTardanzas = input<number>(0);

  onExport = output<void>();
}
