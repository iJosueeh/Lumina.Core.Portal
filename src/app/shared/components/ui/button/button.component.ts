import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses() {
    return {
      'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20': this.variant === 'primary',
      'bg-slate-100 text-slate-700 hover:bg-slate-200': this.variant === 'secondary',
      'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20': this.variant === 'danger',
      'bg-transparent text-slate-500 hover:bg-slate-100': this.variant === 'ghost'
    };
  }
}
