import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  title = input.required<string>();
  description = input<string>('');
  icon = input<string>('search'); // 'search' | 'info' | 'error' | 'course' | 'evaluation'
}
