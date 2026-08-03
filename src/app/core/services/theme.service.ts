// Path: Lumina.Core.Portal/src/app/core/services/theme.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'lumina-theme';
  private readonly THEME_ATTR = 'data-theme';

  /** Current effective theme (resolved from system if needed) */
  private _theme = signal<'light' | 'dark'>('light');
  readonly theme = this._theme.asReadonly();

  /** User preference (may be 'system') */
  private _preference = signal<Theme>('light');
  readonly preference = this._preference.asReadonly();

  /** Whether current theme is dark */
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    this.loadPreference();
    this.applyTheme();

    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this._preference() === 'system') {
          this._theme.set(e.matches ? 'dark' : 'light');
          this.applyTheme();
        }
      });
    }
  }

  private loadPreference(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    const pref = saved || 'system';
    this._preference.set(pref);
    this.resolveTheme(pref);
  }

  private resolveTheme(pref: Theme): void {
    if (pref === 'system') {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
      this._theme.set(prefersDark ? 'dark' : 'light');
    } else {
      this._theme.set(pref);
    }
  }

  private applyTheme(): void {
    document.documentElement.setAttribute(this.THEME_ATTR, this._theme());
    document.documentElement.classList.toggle('dark', this._theme() === 'dark');
  }

  /** Set theme preference and persist */
  setTheme(theme: Theme): void {
    this._preference.set(theme);
    this.resolveTheme(theme);
    this.applyTheme();
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  /** Toggle between light and dark (ignores system) */
  toggle(): void {
    const next = this._theme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }
}
