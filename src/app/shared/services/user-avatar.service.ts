import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserAvatarService {
  private _avatarUrl = signal<string | null>(localStorage.getItem('lumina_avatar'));
  avatarUrl = this._avatarUrl.asReadonly();

  setAvatar(url: string | null): void {
    console.log('[UserAvatarService] setAvatar called with:', url);
    if (url) {
      localStorage.setItem('lumina_avatar', url);
    } else {
      localStorage.removeItem('lumina_avatar');
    }
    this._avatarUrl.set(url);
    console.log('[UserAvatarService] signal is now:', this._avatarUrl());
  }
}
