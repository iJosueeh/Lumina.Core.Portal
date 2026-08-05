// Path: Lumina.Core.Portal/src/app/core/services/site-config.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'lumina-site-name';
  private readonly DEFAULT_NAME = 'LUMINA.CORE';

  /** Current site name — loaded from backend, falls back to localStorage, then default */
  readonly siteName = signal(this.DEFAULT_NAME);

  constructor() {
    this.loadSiteName();
  }

  private loadSiteName(): void {
    // Try localStorage first (instant)
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.siteName.set(saved);
    }

    // Then try backend (async)
    this.http.get<Record<string, any[]>>(environment.systemSettingsApiUrl).pipe(
      catchError(() => of(null))
    ).subscribe(response => {
      if (response) {
        const general = response['general'] || [];
        const setting = general.find((s: any) => s.key === 'general:siteName');
        if (setting?.value) {
          this.siteName.set(setting.value);
          localStorage.setItem(this.STORAGE_KEY, setting.value);
        }
      }
    });
  }

  /** Update site name (called from admin settings) */
  setName(name: string): void {
    this.siteName.set(name);
    localStorage.setItem(this.STORAGE_KEY, name);
  }
}
