import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserAvatarService {
  private authService = inject(AuthService);
  private _avatarUrl = signal<string | null>(null);
  avatarUrl = this._avatarUrl.asReadonly();

  constructor() {
    this.reloadAvatar();
  }

  private getStorageKey(userId?: string | null): string | null {
    const uid = userId || this.authService.getUserId();
    return uid ? `lumina_avatar_${uid}` : null;
  }

  reloadAvatar(): void {
    // Purge legacy un-scoped key if present
    if (localStorage.getItem('lumina_avatar')) {
      localStorage.removeItem('lumina_avatar');
    }

    const key = this.getStorageKey();
    if (key) {
      const stored = localStorage.getItem(key);
      this._avatarUrl.set(stored);
    } else {
      this._avatarUrl.set(null);
    }
  }

  setAvatar(url: string | null, userId?: string | null): void {
    const key = this.getStorageKey(userId);
    if (key) {
      if (url) {
        localStorage.setItem(key, url);
      } else {
        localStorage.removeItem(key);
      }
    }
    // Clean up any legacy un-scoped key
    localStorage.removeItem('lumina_avatar');
    this._avatarUrl.set(url);
  }

  clear(): void {
    const key = this.getStorageKey();
    if (key) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem('lumina_avatar');
    this._avatarUrl.set(null);
  }
}
