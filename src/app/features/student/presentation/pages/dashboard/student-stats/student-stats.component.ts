import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-student-stats',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './student-stats.component.html',
})
export class StudentStatsComponent {
  @Input() coursesCount: number = 0;
  @Input() pendingAssignments: number = 0;
  @Input() isLoading: boolean = false;
}
