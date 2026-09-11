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
    const s = (this.status || '').toUpperCase().trim();
    if (s === 'ACTIVE' || s === 'ACTIVO' || s === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'SUSPENDED' || s === 'INACTIVO' || s === 'DRAFT') return 'bg-red-50 text-red-700 border-red-200';
    if (s === 'PENDING' || s === 'PENDIENTE' || s === 'EN RIESGO' || s === 'RIESGO' || s === 'AT_RISK') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}
