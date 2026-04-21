import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-welcome-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './welcome-header.component.html',
  styleUrl: './welcome-header.component.css'
})
export class WelcomeHeaderComponent {
  @Input({ required: true }) userName: string = '';
  @Input() pendingCount: number = 0;
  @Output() refresh = new EventEmitter<void>();
}
