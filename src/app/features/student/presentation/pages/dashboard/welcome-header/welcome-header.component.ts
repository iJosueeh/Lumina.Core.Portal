import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome-header.component.html',
})
export class WelcomeHeaderComponent {
  @Input() userName: string = 'Estudiante';
  @Input() isLoading: boolean = false;
  @Output() onRefresh = new EventEmitter<void>();
}
