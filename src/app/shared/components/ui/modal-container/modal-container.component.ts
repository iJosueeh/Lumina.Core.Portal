import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-container.component.html',
  styleUrl: './modal-container.component.css'
})
export class ModalContainerComponent {
  @Input() title: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showFooter: boolean = false;
  @Output() close = new EventEmitter<void>();

  get sizeClass() {
    return {
      'max-w-md': this.size === 'sm',
      'max-w-lg': this.size === 'md',
      'max-w-2xl': this.size === 'lg',
      'max-w-4xl': this.size === 'xl'
    };
  }
}
