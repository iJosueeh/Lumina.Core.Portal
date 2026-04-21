import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.css'
})
export class SkeletonLoaderComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() variant: 'text' | 'circle' | 'rect' = 'rect';

  get containerClass() {
    return {
      'rounded-full': this.variant === 'circle',
      'rounded-md': this.variant === 'rect' || this.variant === 'text'
    };
  }
}
