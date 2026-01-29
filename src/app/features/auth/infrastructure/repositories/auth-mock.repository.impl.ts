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
    console.log('🔐 [AUTH MOCK] Login attempt:', credentials.username, 'Role:', credentials.role);

    // Determinar el archivo JSON según el rol
    let jsonPath = '';
    switch (credentials.role) {
      case 'STUDENT':
        jsonPath = '/assets/mock-data/users/students.json';
        break;
      case 'TEACHER':
        jsonPath = '/assets/mock-data/users/teachers.json';
        break;
      case 'ADMIN':
        jsonPath = '/assets/mock-data/users/admins.json';
        break;
      default:
        jsonPath = '/assets/mock-data/users/students.json';
    }

    console.log('📂 [AUTH MOCK] Loading user from:', jsonPath);

    // Cargar usuario desde JSON
    return this.http.get<any>(jsonPath).pipe(
      map((data) => {
        // Si es un array, tomar el primer elemento; si es un objeto, usarlo directamente
        const user = Array.isArray(data) ? data[0] : data;
        
        console.log('✅ [AUTH MOCK] User loaded:', user);
        console.log('✅ [AUTH MOCK] User role:', user.role);
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
