import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.css'
})
export class NotificationToastComponent {
  public notificationService = inject(NotificationService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-bell';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'error': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'info': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  }
}
