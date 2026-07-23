import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationType } from '@shared/services/notification.service';

const ICONS: Record<NotificationType, string> = {
  success: 'fa-check-circle',
  error: 'fa-exclamation-circle',
  info: 'fa-info-circle',
};

const LABELS: Record<NotificationType, string> = {
  success: 'Éxito',
  error: 'Error',
  info: 'Información',
};

const STYLES: Record<NotificationType, string> = {
  success: 'border-l-emerald-500 bg-emerald-50 text-emerald-700',
  error: 'border-l-red-500 bg-red-50 text-red-700',
  info: 'border-l-blue-500 bg-blue-50 text-blue-700',
};

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.css'
})
export class NotificationToastComponent {
  private ns = inject(NotificationService);
  notification = this.ns.notification;
  isClosing = this.ns.isClosing;
  close = () => this.ns.close();

  getIcon(type: NotificationType): string {
    return ICONS[type] || 'fa-bell';
  }

  getLabel(type: NotificationType): string {
    return LABELS[type] || 'Notificación';
  }

  getStyle(type: NotificationType): string {
    return STYLES[type] || 'border-l-slate-500 bg-slate-50 text-slate-700';
  }
}
