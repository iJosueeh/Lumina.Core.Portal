import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/**
 * Interfaz que representa la respuesta del backend de Estudiantes
 * Endpoint: GET /api/perfil-estudiante (puerto 6600)
 * 
 * Todos los campos son opcionales excepto id y estudianteId
 * porque el perfil se crea vacío inicialmente y se completa al editarlo
 */
export interface PerfilEstudianteBackendDto {
  id: string;
  estudianteId: string;
  telefono?: string;
  dni?: string;
  fotoUrl?: string;
  biografia?: string;
  
  // Información académica (opcional)
  carreraId?: string;
  cicloActual?: number;
  modalidad?: 'Presencial' | 'Virtual' | 'Hibrido';
  turno?: 'Manana' | 'Tarde' | 'Noche';
  sede?: string;
  fechaIngreso?: string;
  fechaEgresoPrevista?: string;
  
  // Contacto de emergencia (opcional)
  contactoEmergencia?: {
    nombre: string;
    relacion: string;
    telefono: string;
  };
  
  // Redes sociales (siempre presente pero campos opcionales)
  redesSociales: {
    linkedIn?: string;
    gitHub?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    portfolio?: string;
    youTube?: string;
    tikTok?: string;
  };
  
  fechaCreacion: string;
  fechaActualizacion?: string;
}

/**
 * Servicio para integración con el microservicio de Estudiantes (puerto 6600)
 * Maneja el perfil completo del estudiante con campos opcionales
 */
@Injectable({
  providedIn: 'root',
})
export class EstudiantesPerfilIntegrationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.estudiantesApiUrl || 'http://localhost:6600/api';

  /**
   * Obtiene el perfil completo del estudiante autenticado (usa JWT).
   * Si aún no existe, lo crea automáticamente y reintenta la lectura.
   */
  getPerfilEstudiante(): Observable<PerfilEstudianteBackendDto> {
    return this.http.get<PerfilEstudianteBackendDto>(`${this.apiUrl}/perfil-estudiante`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 404) {
          return throwError(() => error);
        }

        return this.http.post<void>(`${this.apiUrl}/perfil-estudiante`, {}).pipe(
          switchMap(() => this.http.get<PerfilEstudianteBackendDto>(`${this.apiUrl}/perfil-estudiante`))
        );
      })
    );
  }

  /**
   * Actualiza la información personal del perfil
   * Endpoint: PUT /api/perfil-estudiante/personal
   */
  actualizarInformacionPersonal(data: {
    telefono?: string;
    dni?: string;
    biografia?: string;
  }): Observable<{ id: string; message: string }> {
    return this.http.put<{ id: string; message: string }>(
      `${this.apiUrl}/perfil-estudiante/personal`,
      data
    );
  }

  /**
   * Actualiza el contacto de emergencia
   * Endpoint: PUT /api/perfil-estudiante/contacto-emergencia
   */
  actualizarContactoEmergencia(data: {
    nombre: string;
    relacion: string;
    telefono: string;
  }): Observable<{ id: string; message: string }> {
    return this.http.put<{ id: string; message: string }>(
      `${this.apiUrl}/perfil-estudiante/contacto-emergencia`,
      data
    );
  }

  /**
   * Actualiza las redes sociales
   * Endpoint: PUT /api/perfil-estudiante/redes-sociales
   */
  actualizarRedesSociales(data: {
    linkedIn?: string;
    gitHub?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    portfolio?: string;
    youTube?: string;
    tikTok?: string;
  }): Observable<{ id: string; message: string }> {
    return this.http.put<{ id: string; message: string }>(
      `${this.apiUrl}/perfil-estudiante/redes-sociales`,
      data
    );
  }

  /**
   * Actualiza la foto de perfil
   * Endpoint: PUT /api/perfil-estudiante/foto
   */
  actualizarFotoPerfil(fotoUrl: string): Observable<{ id: string; message: string }> {
    return this.http.put<{ id: string; message: string }>(
      `${this.apiUrl}/perfil-estudiante/foto`,
      { fotoUrl }
    );
  }
}
