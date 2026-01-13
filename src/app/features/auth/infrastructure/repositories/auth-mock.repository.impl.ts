import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { User } from '../../domain/models/user.model';
import { LoginCredentials } from '../../domain/models/login-credentials.model';
import { mockLogin } from '../../../../core/mock-data/student.mock';

/**
 * Implementación Mock del repositorio de autenticación
 * Permite login sin backend usando datos estáticos
 */
@Injectable({
  providedIn: 'root',
})
export class AuthMockRepositoryImpl extends AuthRepository {
  private currentUser: User | null = null;

  override login(credentials: LoginCredentials): Observable<User> {
    console.log('🔐 [AUTH MOCK] Login attempt:', credentials.username);

    // Simular validación (acepta cualquier credencial para desarrollo)
    const user = mockLogin(credentials.username, credentials.password);

    if (user) {
      console.log('✅ [AUTH MOCK] Login successful:', user.fullName);
      this.currentUser = user;
      // Guardar en localStorage para persistencia
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('token', user.token);
      return of(user).pipe(delay(500)); // Simular latencia de red
    }

    console.error('❌ [AUTH MOCK] Login failed');
    throw new Error('Credenciales inválidas');
  }

  override logout(): void {
    console.log('🚪 [AUTH MOCK] Logout');
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }

  override getCurrentUser(): User | null {
    if (!this.currentUser) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        console.log('👤 [AUTH MOCK] Current user from storage:', this.currentUser?.fullName);
      } else {
        console.log('👤 [AUTH MOCK] No current user');
      }
    }
    return this.currentUser;
  }
}
