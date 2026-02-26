import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountRepository } from '../../../domain/repositories/account.repository';
import { AccountSettings } from '../../../domain/models/student-profile.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.css',
})
export class AccountSettingsComponent implements OnInit {
  // Signals
  activeTab = signal<'security' | 'notifications' | 'privacy' | 'account'>('security');
  settings = signal<AccountSettings | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showDeleteModal = signal(false);
  showDeactivateModal = signal(false);

  // Forms
  passwordForm!: FormGroup;
  notificationsForm!: FormGroup;
  privacyForm!: FormGroup;
  deleteForm!: FormGroup;

  // Password visibility
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private accountRepository: AccountRepository,
    private router: Router,
    private http: HttpClient,
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  private initializeForms(): void {
    // Formulario de cambio de contraseña
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, this.passwordStrengthValidator]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );

    // Formulario de notificaciones
    this.notificationsForm = this.fb.group({
      email: [true],
      push: [true],
      sms: [false],
    });

    // Formulario de privacidad
    this.privacyForm = this.fb.group({
      perfilPublico: [true],
      mostrarEmail: [false],
      mostrarTelefono: [false],
      mostrarRedesSociales: [true],
    });

    // Formulario para eliminar cuenta
    this.deleteForm = this.fb.group({
      password: ['', Validators.required],
      confirmation: ['', Validators.required],
    });
  }

  private loadSettings(): void {
    this.isLoading.set(true);

    // Cargar settings desde JSON usando HttpClient directo
    this.http.get<AccountSettings>('assets/mock-data/profiles/account-settings.json').subscribe({
      next: (settings) => {
        this.settings.set(settings);

        // Poblar formularios
        this.notificationsForm.patchValue(settings.notificaciones);
        this.privacyForm.patchValue(settings.privacidad);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading account settings:', err);
        this.error.set('Error al cargar la configuración');
        this.isLoading.set(false);
      },
    });
  }

  // Validadores personalizados
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;

    if (!valid) {
      return {
        passwordStrength: {
          hasMinLength,
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSpecial,
        },
      };
    }

    return null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // Cambiar tab
  setActiveTab(tab: 'security' | 'notifications' | 'privacy' | 'account'): void {
    this.activeTab.set(tab);
    this.error.set(null);
    this.successMessage.set(null);
  }

  // Cambiar contraseña
  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.error.set('Por favor completa todos los campos correctamente');
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const { oldPassword, newPassword } = this.passwordForm.value;

    try {
      await this.accountRepository.changePassword(oldPassword, newPassword).toPromise();
      this.successMessage.set('✅ Contraseña cambiada exitosamente');
      this.passwordForm.reset();
    } catch (err: any) {
      this.error.set(err.message || 'Error al cambiar la contraseña');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Guardar configuración de notificaciones
  async saveNotifications(): Promise<void> {
    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const currentSettings = this.settings();
    if (!currentSettings) return;

    const updatedSettings: AccountSettings = {
      ...currentSettings,
      notificaciones: this.notificationsForm.value,
    };

    try {
      await this.accountRepository.updateSettings(updatedSettings).toPromise();
      this.settings.set(updatedSettings);
      this.successMessage.set('✅ Preferencias de notificaciones guardadas');
    } catch (err) {
      this.error.set('Error al guardar las preferencias');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Guardar configuración de privacidad
  async savePrivacy(): Promise<void> {
    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const currentSettings = this.settings();
    if (!currentSettings) return;

    const updatedSettings: AccountSettings = {
      ...currentSettings,
      privacidad: this.privacyForm.value,
    };

    try {
      await this.accountRepository.updateSettings(updatedSettings).toPromise();
      this.settings.set(updatedSettings);
      this.successMessage.set('✅ Configuración de privacidad guardada');
    } catch (err) {
      this.error.set('Error al guardar la configuración');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Desactivar cuenta
  openDeactivateModal(): void {
    this.showDeactivateModal.set(true);
  }

  closeDeactivateModal(): void {
    this.showDeactivateModal.set(false);
  }

  async confirmDeactivate(): Promise<void> {
    this.isSaving.set(true);
    this.error.set(null);

    try {
      await this.accountRepository.deactivateAccount('Usuario solicitó desactivación').toPromise();
      this.successMessage.set('Cuenta desactivada. Redirigiendo...');
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (err) {
      this.error.set('Error al desactivar la cuenta');
    } finally {
      this.isSaving.set(false);
      this.closeDeactivateModal();
    }
  }

  // Eliminar cuenta
  openDeleteModal(): void {
    this.showDeleteModal.set(true);
    this.deleteForm.reset();
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteForm.reset();
  }

  async confirmDelete(): Promise<void> {
    if (this.deleteForm.invalid) {
      this.error.set('Por favor completa todos los campos');
      return;
    }

    const { password, confirmation } = this.deleteForm.value;

    if (confirmation !== 'ELIMINAR') {
      this.error.set('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    try {
      await this.accountRepository.deleteAccount(password).toPromise();
      this.successMessage.set('Cuenta eliminada. Redirigiendo...');
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (err: any) {
      this.error.set(err.message || 'Error al eliminar la cuenta');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Exportar datos
  async exportData(): Promise<void> {
    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const blob = await this.accountRepository.exportData().toPromise();

      // Crear link de descarga
      const url = window.URL.createObjectURL(blob!);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lumina-datos-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.successMessage.set('✅ Datos exportados exitosamente');
    } catch (err) {
      this.error.set('Error al exportar los datos');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Helpers
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getPasswordStrengthErrors(): string[] {
    const errors = this.passwordForm.get('newPassword')?.errors?.['passwordStrength'];
    if (!errors) return [];

    const messages: string[] = [];
    if (!errors.hasMinLength) messages.push('Mínimo 8 caracteres');
    if (!errors.hasUpperCase) messages.push('Al menos una mayúscula');
    if (!errors.hasLowerCase) messages.push('Al menos una minúscula');
    if (!errors.hasNumber) messages.push('Al menos un número');
    if (!errors.hasSpecial) messages.push('Al menos un carácter especial (!@#$%^&*)');

    return messages;
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
