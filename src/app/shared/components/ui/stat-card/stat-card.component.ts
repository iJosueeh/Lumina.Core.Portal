import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = '';
  @Input() icon = 'chart-line';
  @Input() description = '';
  @Input() trend = '';
  @Input() trendType: 'positive' | 'negative' = 'positive';
  @Input() color: 'blue' | 'purple' | 'teal' | 'orange' | 'green' = 'blue';

  get iconBgClass() {
    const map = {
      blue: 'bg-blue-50 text-blue-600',
      purple: 'bg-purple-50 text-purple-600',
      teal: 'bg-teal-50 text-teal-600',
      orange: 'bg-orange-50 text-orange-600',
      green: 'bg-green-50 text-green-600'
    };
    return map[this.color || 'blue'];
  }
}
