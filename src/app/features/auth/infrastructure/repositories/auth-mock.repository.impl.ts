import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { User } from '../../domain/models/user.model';
import { LoginCredentials } from '../../domain/models/login-credentials.model';
import { HttpClient } from '@angular/common/http';

/**
 * Implementación Mock del repositorio de autenticación
 * Carga usuarios desde JSON para desarrollo sin backend
 */
@Injectable({
  providedIn: 'root',
})
export class AuthMockRepositoryImpl extends AuthRepository {
  private currentUser: User | null = null;

  constructor(private http: HttpClient) {
    super();
  }

  override login(credentials: LoginCredentials): Observable<User> {
    console.log('🔐 [AUTH MOCK] Login attempt:', credentials.username);

    // Cargar usuario desde JSON
    return this.http.get<any[]>('/assets/mock-data/users/students.json').pipe(
      map((users) => {
        const user = users[0]; // Tomar el primer usuario por defecto
        console.log('✅ [AUTH MOCK] Login successful:', user.fullName);
        this.currentUser = user;

        // Guardar en localStorage para persistencia
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', user.token);

        return user;
      }),
      delay(500), // Simular latencia de red
    );
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
