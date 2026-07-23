import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notification = signal<{ type: NotificationType; message: string } | null>(null);
  isClosing = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly DURATION = 3500;

  show(type: NotificationType, message: string): void {
    this.isClosing.set(false);
    this.notification.set({ type, message });
    this.clearTimer();
    this.timer = setTimeout(() => this.close(), this.DURATION);
  }

  close(): void {
    if (!this.notification() || this.isClosing()) return;
    this.isClosing.set(true);
    this.clearTimer();
    setTimeout(() => {
      this.notification.set(null);
      this.isClosing.set(false);
    }, 200);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
