import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AccountRepository } from '../../domain/repositories/account.repository';
import { AccountSettings } from '../../domain/models/student-profile.model';
import { getMockAccountSettings } from '../../../../core/mock-data/student.mock';

/**
 * Implementación Mock del repositorio de cuenta
 * Simula operaciones de gestión de cuenta
 */
@Injectable({
  providedIn: 'root',
})
export class AccountMockRepositoryImpl extends AccountRepository {
  private readonly SETTINGS_KEY = 'account_settings';
  private readonly ACCOUNT_STATUS_KEY = 'account_status';

  override changePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    console.log('🔐 [ACCOUNT MOCK] Changing password');

    // Simular validación de contraseña actual
    if (!oldPassword || oldPassword.length < 6) {
      return throwError(() => new Error('Contraseña actual inválida'));
    }

    // Validar nueva contraseña
    if (newPassword.length < 8) {
      return throwError(() => new Error('La nueva contraseña debe tener al menos 8 caracteres'));
    }

    if (!/[A-Z]/.test(newPassword)) {
      return throwError(() => new Error('La contraseña debe contener al menos una mayúscula'));
    }

    if (!/[0-9]/.test(newPassword)) {
      return throwError(() => new Error('La contraseña debe contener al menos un número'));
    }

    console.log('✅ [ACCOUNT MOCK] Password changed successfully');
    return of(true).pipe(delay(800));
  }

  override updateSettings(settings: AccountSettings): Observable<AccountSettings> {
    console.log('⚙️ [ACCOUNT MOCK] Updating account settings');

    // Guardar en localStorage
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    console.log('✅ [ACCOUNT MOCK] Settings updated successfully');

    return of(settings).pipe(delay(400));
  }

  override deactivateAccount(reason?: string): Observable<boolean> {
    console.log('⏸️ [ACCOUNT MOCK] Deactivating account. Reason:', reason || 'No reason provided');

    // Marcar cuenta como desactivada
    localStorage.setItem(
      this.ACCOUNT_STATUS_KEY,
      JSON.stringify({
        status: 'deactivated',
        reason,
        date: new Date().toISOString(),
      }),
    );

    console.log('✅ [ACCOUNT MOCK] Account deactivated successfully');
    return of(true).pipe(delay(600));
  }

  override deleteAccount(password: string): Observable<boolean> {
    console.log('🗑️ [ACCOUNT MOCK] Deleting account permanently');

    // Validar contraseña
    if (!password || password.length < 6) {
      return throwError(() => new Error('Contraseña inválida'));
    }

    // Simular eliminación (en realidad solo limpiamos localStorage)
    localStorage.removeItem('student_profile');
    localStorage.removeItem(this.SETTINGS_KEY);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');

    localStorage.setItem(
      this.ACCOUNT_STATUS_KEY,
      JSON.stringify({
        status: 'deleted',
        date: new Date().toISOString(),
      }),
    );

    console.log('✅ [ACCOUNT MOCK] Account deleted successfully');
    return of(true).pipe(delay(1000));
  }

  override exportData(): Observable<Blob> {
    console.log('📦 [ACCOUNT MOCK] Exporting user data');

    // Recopilar todos los datos del usuario
    const profile = localStorage.getItem('student_profile');
    const settings = localStorage.getItem(this.SETTINGS_KEY);
    const user = localStorage.getItem('currentUser');

    const exportData = {
      exportDate: new Date().toISOString(),
      profile: profile ? JSON.parse(profile) : null,
      settings: settings ? JSON.parse(settings) : getMockAccountSettings(),
      user: user ? JSON.parse(user) : null,
    };

    // Convertir a JSON y crear Blob
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    console.log('✅ [ACCOUNT MOCK] Data exported successfully');
    return of(blob).pipe(delay(500));
  }
}
