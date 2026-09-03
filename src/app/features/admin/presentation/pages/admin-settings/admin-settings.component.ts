// Path: Lumina.Core.Portal/src/app/features/admin/presentation/pages/admin-settings/admin-settings.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { NotificationService } from '@shared/services/notification.service';
import { ThemeService, Theme } from '@core/services/theme.service';
import { SiteConfigService } from '@core/services/site-config.service';

type SettingsTab = 'general' | 'appearance';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  readonly themeService = inject(ThemeService);
  private siteConfig = inject(SiteConfigService);

  /** Active settings tab */
  activeTab = signal<SettingsTab>('general');

  /** Loading states */
  isLoading = signal(true);
  isSaving = signal(false);

  /** Settings forms - simplified */
  generalForm: FormGroup;
  appearanceForm: FormGroup;

  /** Theme options */
  readonly themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: 'sun' },
    { value: 'dark', label: 'Oscuro', icon: 'moon' },
    { value: 'system', label: 'Sistema', icon: 'desktop' }
  ];

  /** Accent color options */
  readonly accentColors = [
    { value: '#4f46e5', label: 'Índigo' },
    { value: '#7c3aed', label: 'Violeta' },
    { value: '#2563eb', label: 'Azul' },
    { value: '#059669', label: 'Esmeralda' },
    { value: '#d97706', label: 'Ámbar' },
    { value: '#dc2626', label: 'Rojo' }
  ];

  /** Tabs configuration - only 2 tabs now */
  readonly tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'cog' },
    { id: 'appearance', label: 'Apariencia', icon: 'palette' }
  ];

  /** Current effective theme for display */
  readonly currentThemeLabel = computed(() => {
    const theme = this.themeService.preference();
    return this.themeOptions.find(t => t.value === theme)?.label || 'Sistema';
  });

  constructor() {
    // Simplified General form - only essential settings
    this.generalForm = this.fb.group({
      siteName: ['Lumina.Core', [Validators.required, Validators.minLength(3)]],
      maintenanceMode: [false],
      allowRegistration: [true]
    });

    // Simplified Appearance form - only theme and accent color
    this.appearanceForm = this.fb.group({
      theme: ['light'],
      primaryColor: ['#4f46e5']
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Try to load from backend first
      const response = await firstValueFrom(
        this.http.get<Record<string, any[]>>(environment.systemSettingsApiUrl)
      );

      if (response) {
        this.patchFormsFromResponse(response);
      }
    } catch {
      // Fallback to localStorage if backend not available
      this.loadFromLocalStorage();
    } finally {
      // Sync theme with ThemeService
      this.appearanceForm.patchValue({ theme: this.themeService.preference() });
      this.isLoading.set(false);
    }
  }

  private patchFormsFromResponse(response: Record<string, any[]>): void {
    // Patch general settings - only essential ones
    const general = response['general'] || [];
    this.generalForm.patchValue({
      siteName: this.getSettingValue(general, 'general:siteName', 'Lumina.Core'),
      maintenanceMode: this.getSettingValue(general, 'general:maintenanceMode', 'false') === 'true',
      allowRegistration: this.getSettingValue(general, 'general:allowRegistration', 'true') === 'true'
    });

    // Patch appearance settings - only theme and accent color
    const appearance = response['appearance'] || [];
    this.appearanceForm.patchValue({
      theme: this.getSettingValue(appearance, 'appearance:theme', 'light'),
      primaryColor: this.getSettingValue(appearance, 'appearance:primaryColor', '#4f46e5')
    });

    // Apply theme from backend
    const theme = this.appearanceForm.get('theme')?.value as Theme;
    if (theme && theme !== this.themeService.preference()) {
      this.themeService.setTheme(theme);
    }

    // Apply accent color
    const accentColor = this.appearanceForm.get('primaryColor')?.value;
    if (accentColor) {
      this.themeService.setAccentColor(accentColor);
    }
  }

  private getSettingValue(settings: any[], key: string, defaultValue: string): string {
    const setting = settings.find((s: any) => s.key === key);
    return setting?.value ?? defaultValue;
  }

  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('admin-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.generalForm.patchValue(settings.general || {});
        this.appearanceForm.patchValue(settings.appearance || {});
      }
    } catch {
      // Use defaults
    }
  }

  /** Save all settings */
  async saveSettings(): Promise<void> {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      this.notification.show('error', 'Revisa los campos de configuración general.');
      return;
    }

    this.isSaving.set(true);
    try {
      // Save general settings
      await firstValueFrom(
        this.http.put(`${environment.systemSettingsApiUrl}/general`, {
          siteName: this.generalForm.get('siteName')?.value,
          maintenanceMode: this.generalForm.get('maintenanceMode')?.value,
          allowRegistration: this.generalForm.get('allowRegistration')?.value,
          updatedBy: 'admin'
        })
      );

      // Save appearance settings
      await firstValueFrom(
        this.http.put(`${environment.systemSettingsApiUrl}/appearance`, {
          theme: this.appearanceForm.get('theme')?.value,
          primaryColor: this.appearanceForm.get('primaryColor')?.value,
          updatedBy: 'admin'
        })
      );

      // Apply theme change
      const newTheme = this.appearanceForm.get('theme')?.value as Theme;
      if (newTheme !== this.themeService.preference()) {
        this.themeService.setTheme(newTheme);
      }

      // Apply accent color
      const accentColor = this.appearanceForm.get('primaryColor')?.value;
      if (accentColor) {
        this.themeService.setAccentColor(accentColor);
      }

      // Sync siteName across all layouts
      const siteName = this.generalForm.get('siteName')?.value;
      if (siteName) {
        this.siteConfig.setName(siteName);
      }

      this.notification.show('success', 'Configuración guardada correctamente.');
    } catch {
      // Fallback to localStorage
      this.saveToLocalStorage();
      this.notification.show('info', 'Configuración guardada localmente (backend no disponible).');
    } finally {
      this.isSaving.set(false);
    }
  }

  private saveToLocalStorage(): void {
    const settings = {
      general: this.generalForm.value,
      appearance: this.appearanceForm.value
    };
    localStorage.setItem('admin-settings', JSON.stringify(settings));

    // Apply theme change
    const newTheme = this.appearanceForm.get('theme')?.value as Theme;
    if (newTheme !== this.themeService.preference()) {
      this.themeService.setTheme(newTheme);
    }

    // Apply accent color
    const accentColor = this.appearanceForm.get('primaryColor')?.value;
    if (accentColor) {
      this.themeService.setAccentColor(accentColor);
    }
  }

  /** Switch active tab */
  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  /** Quick theme toggle */
  toggleTheme(): void {
    this.themeService.toggle();
    this.appearanceForm.patchValue({ theme: this.themeService.preference() });
  }

  /** Apply accent color */
  applyAccentColor(color: string): void {
    this.appearanceForm.patchValue({ primaryColor: color });
    this.themeService.setAccentColor(color);
  }

  /** Check if tab has validation errors */
  hasTabErrors(tab: SettingsTab): boolean {
    const form = this.getFormByTab(tab);
    return form ? form.invalid && form.dirty : false;
  }

  private getFormByTab(tab: SettingsTab): FormGroup | null {
    switch (tab) {
      case 'general': return this.generalForm;
      case 'appearance': return this.appearanceForm;
      default: return null;
    }
  }
}
