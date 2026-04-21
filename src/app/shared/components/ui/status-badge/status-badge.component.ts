import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: string = '';
  @Input() label?: string;

  get badgeClass() {
    const s = (this.status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'ACTIVO' || s === 'PUBLISHED') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (s === 'SUSPENDED' || s === 'INACTIVO' || s === 'DRAFT') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (s === 'PENDING' || s === 'PENDIENTE') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}
