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

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'security';

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

  /** Settings forms */
  generalForm: FormGroup;
  appearanceForm: FormGroup;
  notificationForm: FormGroup;
  securityForm: FormGroup;

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

  /** Tabs configuration */
  readonly tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'cog' },
    { id: 'appearance', label: 'Apariencia', icon: 'palette' },
    { id: 'notifications', label: 'Notificaciones', icon: 'bell' },
    { id: 'security', label: 'Seguridad', icon: 'shield-alt' }
  ];

  /** Current effective theme for display */
  readonly currentThemeLabel = computed(() => {
    const theme = this.themeService.preference();
    return this.themeOptions.find(t => t.value === theme)?.label || 'Sistema';
  });

  constructor() {
    this.generalForm = this.fb.group({
      siteName: ['Lumina.Core', [Validators.required, Validators.minLength(3)]],
      siteDescription: ['Plataforma educativa enterprise'],
      maintenanceMode: [false],
      allowRegistration: [true],
      defaultLanguage: ['es']
    });

    this.appearanceForm = this.fb.group({
      theme: ['light'],
      primaryColor: ['#4f46e5'],
      sidebarCollapsed: [false],
      compactMode: [false],
      showAnimations: [true]
    });

    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [true],
      courseUpdates: [true],
      gradeNotifications: [true],
      systemAlerts: [true]
    });

    this.securityForm = this.fb.group({
      sessionTimeout: [30, [Validators.required, Validators.min(5), Validators.max(1440)]],
      requireTwoFactor: [false],
      passwordMinLength: [8, [Validators.required, Validators.min(6)]],
      allowPasswordReset: [true]
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
    // Patch general settings
    const general = response['general'] || [];
    this.generalForm.patchValue({
      siteName: this.getSettingValue(general, 'general:siteName', 'Lumina.Core'),
      siteDescription: this.getSettingValue(general, 'general:siteDescription', 'Plataforma educativa enterprise'),
      maintenanceMode: this.getSettingValue(general, 'general:maintenanceMode', 'false') === 'true',
      allowRegistration: this.getSettingValue(general, 'general:allowRegistration', 'true') === 'true',
      defaultLanguage: this.getSettingValue(general, 'general:defaultLanguage', 'es')
    });

    // Patch appearance settings
    const appearance = response['appearance'] || [];
    this.appearanceForm.patchValue({
      theme: this.getSettingValue(appearance, 'appearance:theme', 'light'),
      primaryColor: this.getSettingValue(appearance, 'appearance:primaryColor', '#4f46e5'),
      sidebarCollapsed: this.getSettingValue(appearance, 'appearance:sidebarCollapsed', 'false') === 'true',
      compactMode: this.getSettingValue(appearance, 'appearance:compactMode', 'false') === 'true',
      showAnimations: this.getSettingValue(appearance, 'appearance:showAnimations', 'true') === 'true'
    });

    // Patch notification settings
    const notifications = response['notifications'] || [];
    this.notificationForm.patchValue({
      emailNotifications: this.getSettingValue(notifications, 'notifications:emailNotifications', 'true') === 'true',
      pushNotifications: this.getSettingValue(notifications, 'notifications:pushNotifications', 'true') === 'true',
      courseUpdates: this.getSettingValue(notifications, 'notifications:courseUpdates', 'true') === 'true',
      gradeNotifications: this.getSettingValue(notifications, 'notifications:gradeNotifications', 'true') === 'true',
      systemAlerts: this.getSettingValue(notifications, 'notifications:systemAlerts', 'true') === 'true'
    });

    // Patch security settings
    const security = response['security'] || [];
    this.securityForm.patchValue({
      sessionTimeout: parseInt(this.getSettingValue(security, 'security:sessionTimeout', '30'), 10),
      requireTwoFactor: this.getSettingValue(security, 'security:requireTwoFactor', 'false') === 'true',
      passwordMinLength: parseInt(this.getSettingValue(security, 'security:passwordMinLength', '8'), 10),
      allowPasswordReset: this.getSettingValue(security, 'security:allowPasswordReset', 'true') === 'true'
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

    // Apply showAnimations
    const showAnims = this.appearanceForm.get('showAnimations')?.value;
    this.themeService.setShowAnimations(!!showAnims);
  }

  private getSettingValue(settings: any[], key: string, defaultValue: string): string {
    const setting = settings.find(s => s.key === key);
    return setting?.value ?? defaultValue;
  }

  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('admin-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.generalForm.patchValue(settings.general || {});
        this.appearanceForm.patchValue(settings.appearance || {});
        this.notificationForm.patchValue(settings.notifications || {});
        this.securityForm.patchValue(settings.security || {});
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
      // Try to save to backend
      await firstValueFrom(
        this.http.put(`${environment.systemSettingsApiUrl}/general`, {
          ...this.generalForm.value,
          updatedBy: 'admin'
        })
      );

      await firstValueFrom(
        this.http.put(`${environment.systemSettingsApiUrl}/appearance`, {
          ...this.appearanceForm.value,
          updatedBy: 'admin'
        })
      );

      await firstValueFrom(
        this.http.put(`${environment.systemSettingsApiUrl}/notifications`, {
          ...this.notificationForm.value,
          updatedBy: 'admin'
        })
      );

      await firstValueFrom(
        this.http.put(`${environment.systemSettingsApiUrl}/security`, {
          ...this.securityForm.value,
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

      // Apply animations
      const showAnims = this.appearanceForm.get('showAnimations')?.value;
      this.themeService.setShowAnimations(!!showAnims);

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
      appearance: this.appearanceForm.value,
      notifications: this.notificationForm.value,
      security: this.securityForm.value
    };
    localStorage.setItem('admin-settings', JSON.stringify(settings));

    // Apply theme change
    const newTheme = this.appearanceForm.get('theme')?.value as Theme;
    if (newTheme !== this.themeService.preference()) {
      this.themeService.setTheme(newTheme);
    }

    // Apply accent color via ThemeService (persists to localStorage)
    const accentColor = this.appearanceForm.get('primaryColor')?.value;
    if (accentColor) {
      this.themeService.setAccentColor(accentColor);
    }

    // Apply animations via ThemeService
    const showAnims = this.appearanceForm.get('showAnimations')?.value;
    this.themeService.setShowAnimations(!!showAnims);
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

  /** Toggle animations immediately */
  toggleAnimations(): void {
    const current = this.appearanceForm.get('showAnimations')?.value;
    this.appearanceForm.patchValue({ showAnimations: !current });
    this.themeService.setShowAnimations(!current);
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
      case 'notifications': return this.notificationForm;
      case 'security': return this.securityForm;
      default: return null;
    }
  }
}
