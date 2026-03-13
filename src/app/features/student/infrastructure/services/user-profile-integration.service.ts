import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface UserProfileBackendDto {
  id: string;
  email: string;
  nombresPersona: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  pais: string;
  departamento: string;
  provincia: string;
  distrito: string;
  calle: string;
  username: string;
}

interface UpdateProfileRequest {
  nombresPersona?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fechaNacimiento?: string;
  pais?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  calle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileIntegrationService {
  private readonly usuariosApiUrl = environment.usuariosApiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el perfil del usuario autenticado desde el backend
   */
  getUserProfile(): Observable<UserProfileBackendDto> {
    console.log('👤 [USER-PROFILE] Obteniendo perfil del usuario autenticado');
    return this.http.get<{ success: boolean; data: UserProfileBackendDto }>(`${this.usuariosApiUrl}/users/profile`)
      .pipe(
        map(response => {
          console.log('✅ [USER-PROFILE] Perfil obtenido:', response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('❌ [USER-PROFILE] Error al obtener perfil:', error);
          if (error.status === 401) {
            console.error('⚠️ Token no válido o expirado. Intente iniciar sesión nuevamente.');
          }
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualiza el perfil del usuario autenticado
   */
  updateUserProfile(request: UpdateProfileRequest): Observable<void> {
    console.log('💾 [USER-PROFILE] Actualizando perfil del usuario:', request);
    return this.http.put<{ success: boolean; message: string }>(`${this.usuariosApiUrl}/users/profile`, request)
      .pipe(
        map(response => {
          console.log('✅ [USER-PROFILE] Perfil actualizado:', response.message);
          return undefined;
        }),
        catchError(error => {
          console.error('❌ [USER-PROFILE] Error al actualizar perfil:', error);
          return throwError(() => error);
        })
      );
  }
}
