import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-classroom-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-header.component.html',
  styleUrl: './classroom-header.component.css'
})
export class ClassroomHeaderComponent {
  courseTitle = input.required<string>();
  lessonTitle = input<string>('');
  progress = input<number>(0);
  autoplay = input<boolean>(false);
  hasPrevious = input<boolean>(false);
  hasNext = input<boolean>(false);
  
  onBack = output<void>();
  onPrevious = output<void>();
  onNext = output<void>();
  onToggleAutoplay = output<void>();
}
