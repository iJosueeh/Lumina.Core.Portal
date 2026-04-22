import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-student-stats',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './student-stats.component.html',
  styleUrl: './student-stats.component.css'
})
export class StudentStatsComponent {
  total = input.required<number>();
  active = input.required<number>();
  atRisk = input.required<number>();

  activePercentage() {
    if (this.total() === 0) return 0;
    return Math.round((this.active() / this.total()) * 100);
  }
}
