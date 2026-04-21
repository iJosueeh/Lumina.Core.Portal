import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../../../../shared/components/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-grades-stats-summary',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './stats-summary.component.html',
  styleUrl: './stats-summary.component.css'
})
export class GradesStatsSummaryComponent {
  @Input() stats: any = null;
}
