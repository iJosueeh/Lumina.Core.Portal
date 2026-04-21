import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notification = signal<{ type: NotificationType; message: string } | null>(null);
  notificationClosing = signal(false);
  notificationDuration = signal(3500);
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;

  show(type: NotificationType, message: string, duration = 3500): void {
    this.notificationClosing.set(false);
    this.notificationDuration.set(duration);
    this.notification.set({ type, message });

    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }

    this.notificationTimer = setTimeout(() => {
      this.close();
    }, duration);
  }

  close(): void {
    if (!this.notification() || this.notificationClosing()) {
      return;
    }

    this.notificationClosing.set(true);

    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }

    setTimeout(() => {
      this.notification.set(null);
      this.notificationClosing.set(false);
    }, 170);
  }
}
