import { Injectable } from '@angular/core';
import { CookieService } from './cookie.service';
import { User } from '@features/auth/domain/models/user.model';

interface DecodedToken {
  // Claims estándar de .NET
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  
  // Aliases cortos (por si acaso)
  nameid?: string;
  unique_name?: string;
  email?: string;
  role?: string | string[];
  
  // Claims JWT estándar
  sub?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  aud?: string;
  
  // Índice dinámico para otros claims
  [key: string]: any;
}

export type SystemRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  
  constructor(private cookieService: CookieService) {}

  /**
   * Obtiene el token JWT desde cookies o localStorage
   */
  getToken(): string | null {
    // Primero intenta desde cookies
    let token = this.cookieService.get('auth_token');
    
    // Fallback a localStorage
    if (!token) {
      token = localStorage.getItem('token');
      
      // Si existe en localStorage, migrar a cookies
      if (token) {
        console.log('⚠️ [AUTH SERVICE] Migrando token de localStorage a cookies');
        this.cookieService.set('auth_token', token, {
          expires: 7,
          path: '/',
          sameSite: 'Lax',
          secure: false
        });
        localStorage.removeItem('token');
      }
    }
    
    return token;
  }

  /**
   * Decodifica el token JWT y extrae el payload
   */
  private decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ [AUTH SERVICE] Token JWT inválido');
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('❌ [AUTH SERVICE] Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * Obtiene el ID del usuario autenticado desde el token JWT
   */
  getUserId(): string | null {
    const token = this.getToken();
    
    if (!token) {
      console.warn('⚠️ [AUTH SERVICE] No hay token disponible');
      return null;
    }

    const decoded = this.decodeToken(token);
    
    if (!decoded) {
      return null;
    }

    // Debug: mostrar todos los claims disponibles
    console.log('🔍 [AUTH SERVICE] Claims disponibles:', Object.keys(decoded));

    // ClaimTypes.NameIdentifier se serializa con URL completa en .NET JWT
    const userId = 
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      decoded.nameid || 
      decoded.sub ||
      decoded.unique_name;
    
    if (!userId) {
      console.error('❌ [AUTH SERVICE] No se encontró el ID de usuario en el token');
      console.error('Token decodificado:', decoded);
      return null;
    }

    console.log('✅ [AUTH SERVICE] User ID extraído:', userId);
    return userId;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return false;
    }

    // Verificar si el token ha expirado
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  }

  /**
   * Obtiene el rol del usuario
   */
  getUserRole(): string | string[] | null {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    
    // ClaimTypes.Role se serializa con URL completa en .NET JWT
    return decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
           decoded?.role || 
           null;
  }

  /**
   * Cierra sesión eliminando el token
   */
  logout(): void {
    this.currentUser = null;
    this.cookieService.delete('auth_token', '/');
    this.cookieService.delete('current_user', '/');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  /**
   * Establece la sesión del usuario (login exitoso)
   */
  setSession(user: User): void {
    this.currentUser = user;
    
    // Guardar token en cookie segura
    this.cookieService.set('auth_token', user.token, {
      expires: 7,
      path: '/',
      sameSite: 'Lax',
      secure: false
    });
    
    // Guardar usuario en cookie (sin token por seguridad)
    const userWithoutToken = { ...user, token: '' };
    this.cookieService.set('current_user', JSON.stringify(userWithoutToken), {
      expires: 7,
      path: '/',
      sameSite: 'Lax'
    });
    
    // Limpiar localStorage legacy
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }

  /**
   * Obtiene el usuario actual desde cookies
   */
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    // Intentar recuperar de cookies
    const storedInCookie = this.cookieService.get('current_user');
    if (storedInCookie) {
      try {
        const user = JSON.parse(storedInCookie) as User;
        const token = this.cookieService.get('auth_token');
        if (token) {
          this.currentUser = { ...user, token };
          return this.currentUser;
        }
      } catch {
        // Invalid stored data
      }
    }
    
    // Fallback a localStorage (legacy)
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored) as User;
        return this.currentUser;
      } catch {
        // Invalid stored data
      }
    }
    
    return null;
  }

  /**
   * Mapea un rol del backend a SystemRole
   */
  mapBackendRole(backendRole: string): SystemRole {
    const roleMap: Record<string, SystemRole> = {
      'ESTUDIANTE': 'STUDENT',
      'STUDENT': 'STUDENT',
      'PROFESOR': 'TEACHER',
      'TEACHER': 'TEACHER',
      'DOCENTE': 'TEACHER',
      'ADMIN': 'ADMIN',
      'ADMINISTRADOR': 'ADMIN'
    };
    return roleMap[backendRole?.toUpperCase()] || 'STUDENT';
  }
}
