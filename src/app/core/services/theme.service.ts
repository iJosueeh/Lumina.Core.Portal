// Path: Lumina.Core.Portal/src/app/core/services/theme.service.ts
import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'lumina-theme';
  private readonly ACCENT_KEY = 'lumina-accent-color';
  private readonly ANIMATIONS_KEY = 'lumina-show-animations';
  private readonly THEME_ATTR = 'data-theme';

  /** Current effective theme (resolved from system if needed) */
  private _theme = signal<'light' | 'dark'>('light');
  readonly theme = this._theme.asReadonly();

  /** User preference (may be 'system') */
  private _preference = signal<Theme>('light');
  readonly preference = this._preference.asReadonly();

  /** Whether current theme is dark */
  readonly isDark = computed(() => this._theme() === 'dark');

  /** Whether animations are enabled */
  private _showAnimations = signal(true);
  readonly showAnimations = this._showAnimations.asReadonly();

  constructor() {
    this.loadPreference();
    this.applyTheme();
    this.loadAccentColor();
    this.loadAnimations();

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

  // ── Theme ──────────────────────────────────────────

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

  // ── Accent Color ───────────────────────────────────

  private loadAccentColor(): void {
    const saved = localStorage.getItem(this.ACCENT_KEY);
    if (saved) {
      this.applyAccentColor(saved, false);
    }
  }

  /** Set accent color and optionally persist */
  setAccentColor(color: string, persist = true): void {
    this.applyAccentColor(color, persist);
  }

  private applyAccentColor(color: string, persist: boolean): void {
    document.documentElement.style.setProperty('--accent-primary', color);
    if (persist) {
      localStorage.setItem(this.ACCENT_KEY, color);
    }
  }

  /** Get saved accent color or null */
  getAccentColor(): string | null {
    return localStorage.getItem(this.ACCENT_KEY);
  }

  // ── Animations ─────────────────────────────────────

  private loadAnimations(): void {
    const saved = localStorage.getItem(this.ANIMATIONS_KEY);
    if (saved !== null) {
      this._showAnimations.set(saved !== 'false');
    }
    this.applyAnimations(this._showAnimations());
  }

  /** Toggle animations on/off */
  setShowAnimations(enabled: boolean): void {
    this._showAnimations.set(enabled);
    localStorage.setItem(this.ANIMATIONS_KEY, String(enabled));
    this.applyAnimations(enabled);
  }

  private applyAnimations(enabled: boolean): void {
    document.documentElement.classList.toggle('no-animations', !enabled);
  }
}
