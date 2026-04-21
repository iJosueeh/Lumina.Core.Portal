import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-student-stats',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './student-stats.component.html',
  styleUrl: './student-stats.component.css'
})
export class StudentStatsComponent {
  @Input() stats: any = {
    promedio: '15.4',
    cursosActivos: 6,
    creditosTotales: 18,
    asistencia: '92%'
  };
}
