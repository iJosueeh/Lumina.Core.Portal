import { Injectable } from '@angular/core';
import { CookieService } from './cookie.service';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
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
    this.cookieService.delete('auth_token', '/');
    localStorage.removeItem('token');
    console.log('✅ [AUTH SERVICE] Sesión cerrada');
  }
}
