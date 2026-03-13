import { Injectable } from '@angular/core';
import { Observable, map, forkJoin, of, catchError, switchMap } from 'rxjs';
import { ProfileRepository } from '../../domain/repositories/profile.repository';
import { StudentProfile, SocialLinks } from '../../domain/models/student-profile.model';
import { UserProfileIntegrationService } from '../services/user-profile-integration.service';
import { EstudiantesPerfilIntegrationService } from '../services/estudiantes-perfil-integration.service';

/**
 * Implementación del ProfileRepository que combina datos de:
 * 1. Microservicio de Usuarios (puerto 7777): Información básica del usuario
 * 2. Microservicio de Estudiantes (puerto 6600): Perfil completo académico
 * 
 * Los campos del perfil son opcionales y se muestran como temporales si no están completados.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileApiRepositoryImpl extends ProfileRepository {
  constructor(
    private userProfileService: UserProfileIntegrationService,
    private estudiantesPerfilService: EstudiantesPerfilIntegrationService
  ) {
    super();
  }

  override getStudentProfile(studentId: string): Observable<StudentProfile> {
    console.log('👤 [PROFILE API] Obteniendo perfil del estudiante:', studentId);

    // Obtener datos de ambos microservicios en paralelo
    return forkJoin({
      userProfile: this.userProfileService.getUserProfile(),
      estudiantePerfil: this.estudiantesPerfilService.getPerfilEstudiante().pipe(
        catchError(error => {
          console.warn('⚠️ [PROFILE API] Perfil de estudiante no encontrado, usando valores por defecto', error);
          return of(null);
        })
      )
    }).pipe(
      map(({ userProfile, estudiantePerfil }) => {
        // Combinar datos de ambas fuentes
        const profile: StudentProfile = {
          // Información básica del microservicio de Usuarios
          id: userProfile.id,
          codigo: userProfile.username,
          nombres: userProfile.nombresPersona,
          apellidoPaterno: userProfile.apellidoPaterno,
          apellidoMaterno: userProfile.apellidoMaterno,
          email: userProfile.email,
          fechaNacimiento: userProfile.fechaNacimiento,
          
          // Información del perfil de Estudiantes (si existe, sino valores temporales)
          telefono: estudiantePerfil?.telefono || '+51 999 999 999 (temporal)',
          dni: estudiantePerfil?.dni || '00000000 (temporal)',
          fotoUrl: estudiantePerfil?.fotoUrl,

          // Información académica (temporal si no existe)
          carrera: {
            id: estudiantePerfil?.carreraId || '1',
            nombre: 'Ingeniería de Software (temporal)',
            facultad: 'Facultad de Ingeniería (temporal)'
          },
          ciclo: estudiantePerfil?.cicloActual || 1,
          modalidad: this.mapModalidad(estudiantePerfil?.modalidad),
          turno: this.mapTurno(estudiantePerfil?.turno),
          sede: estudiantePerfil?.sede || 'Lima (temporal)',
          fechaIngreso: estudiantePerfil?.fechaIngreso || new Date().toISOString().split('T')[0],
          fechaEgresoPrevista: estudiantePerfil?.fechaEgresoPrevista || '2026-12-31',

          // Dirección del backend de Usuarios
          direccion: {
            departamento: userProfile.departamento || 'Lima',
            provincia: userProfile.provincia || 'Lima',
            distrito: userProfile.distrito || '',
            calle: userProfile.calle || '',
            referencia: ''
          },

          // Contacto de emergencia (del perfil o temporal)
          contactoEmergencia: estudiantePerfil?.contactoEmergencia || {
            nombre: 'Sin definir',
            relacion: 'Edite su perfil',
            telefono: 'Sin definir'
          },

          // Redes sociales (siempre presente)
          redesSociales: {
            linkedin: estudiantePerfil?.redesSociales.linkedIn,
            github: estudiantePerfil?.redesSociales.gitHub,
            twitter: estudiantePerfil?.redesSociales.twitter,
            facebook: estudiantePerfil?.redesSociales.facebook,
            instagram: estudiantePerfil?.redesSociales.instagram,
            portfolio: estudiantePerfil?.redesSociales.portfolio,
            youtube: estudiantePerfil?.redesSociales.youTube,
            medium: estudiantePerfil?.redesSociales.tikTok
          },

          // Estadísticas (temporal hasta que estén en backend)
          promedioGeneral: 16.5,
          creditosAprobados: 120,
          totalCreditos: 200,

          biografia: estudiantePerfil?.biografia
        };

        console.log('✅ [PROFILE API] Perfil combinado:', profile);
        return profile;
      })
    );
  }

  /**
   * Mapea la modalidad del backend al formato del frontend
   */
  private mapModalidad(modalidad?: 'Presencial' | 'Virtual' | 'Hibrido'): 'Presencial' | 'Virtual' | 'Híbrido' {
    if (!modalidad) return 'Virtual';
    const map: Record<string, 'Presencial' | 'Virtual' | 'Híbrido'> = {
      'Presencial': 'Presencial',
      'Virtual': 'Virtual',
      'Hibrido': 'Híbrido'
    };
    return map[modalidad] || 'Virtual';
  }

  /**
   * Mapea el turno del backend al formato del frontend
   */
  private mapTurno(turno?: 'Manana' | 'Tarde' | 'Noche'): 'Mañana' | 'Tarde' | 'Noche' {
    if (!turno) return 'Noche';
    const map: Record<string, 'Mañana' | 'Tarde' | 'Noche'> = {
      'Manana': 'Mañana',
      'Tarde': 'Tarde',
      'Noche': 'Noche'
    };
    return map[turno] || 'Noche';
  }

  override updateProfile(
    studentId: string,
    profile: Partial<StudentProfile>,
  ): Observable<StudentProfile> {
    console.log('💾 [PROFILE API] Actualizando perfil del estudiante:', studentId, profile);

    // Preparar actualizaciones en paralelo
    const updates: Observable<any>[] = [];

    // 1. Actualizar información básica en el microservicio de Usuarios (si hay cambios)
    if (profile.nombres || profile.apellidoPaterno || profile.apellidoMaterno || profile.direccion) {
      updates.push(
        this.userProfileService.getUserProfile().pipe(
          switchMap((currentUserProfile) => {
            const userUpdateRequest = {
              nombresPersona: profile.nombres ?? currentUserProfile.nombresPersona,
              apellidoPaterno: profile.apellidoPaterno ?? currentUserProfile.apellidoPaterno,
              apellidoMaterno: profile.apellidoMaterno ?? currentUserProfile.apellidoMaterno,
              fechaNacimiento: profile.fechaNacimiento ?? currentUserProfile.fechaNacimiento,
              pais: currentUserProfile.pais || 'Peru',
              departamento: profile.direccion?.departamento ?? currentUserProfile.departamento,
              provincia: profile.direccion?.provincia ?? currentUserProfile.provincia,
              distrito: profile.direccion?.distrito ?? currentUserProfile.distrito,
              calle: profile.direccion?.calle ?? currentUserProfile.calle,
            };

            return this.userProfileService.updateUserProfile(userUpdateRequest);
          })
        )
      );
    }

    // 2. Actualizar información personal en el microservicio de Estudiantes
    if (profile.telefono || profile.dni || profile.biografia) {
      updates.push(
        this.estudiantesPerfilService.actualizarInformacionPersonal({
          telefono: profile.telefono,
          dni: profile.dni,
          biografia: profile.biografia
        })
      );
    }

    // 3. Actualizar contacto de emergencia si hay cambios
    if (profile.contactoEmergencia) {
      updates.push(
        this.estudiantesPerfilService.actualizarContactoEmergencia({
          nombre: profile.contactoEmergencia.nombre,
          relacion: profile.contactoEmergencia.relacion,
          telefono: profile.contactoEmergencia.telefono
        })
      );
    }

    // Ejecutar todas las actualizaciones en paralelo
    if (updates.length === 0) {
      console.log('⚠️ [PROFILE API] No hay cambios para actualizar');
      return this.getStudentProfile(studentId);
    }

    return forkJoin(updates).pipe(
      map(() => {
        console.log('✅ [PROFILE API] Perfil actualizado exitosamente');
        return {} as StudentProfile; // El componente debería recargar el perfil
      })
    );
  }

  override updateSocialLinks(studentId: string, links: SocialLinks): Observable<SocialLinks> {
    console.log('🔗 [PROFILE API] Actualizando redes sociales:', studentId, links);
    
    // Mapear las redes sociales al formato del backend
    const redesSociales = {
      linkedIn: links.linkedin,
      gitHub: links.github,
      twitter: links.twitter,
      facebook: links.facebook,
      instagram: links.instagram,
      portfolio: links.portfolio,
      youTube: links.youtube,
      tikTok: links.medium // Nota: medium se mapea a tikTok por ahora
    };

    return this.estudiantesPerfilService.actualizarRedesSociales(redesSociales).pipe(
      map(() => links)
    );
  }

  override uploadProfilePhoto(studentId: string, file: File): Observable<string> {
    console.log('📸 [PROFILE API] Subiendo foto de perfil:', studentId);
    
    // TODO: Implementar subida de archivo a un servicio de storage (S3, Azure Blob, etc.)
    // Por ahora simulamos la URL de la foto subida
    const fotoUrl = `https://ui-avatars.com/api/?name=${studentId}&background=3b82f6&color=fff&size=256`;
    
    return this.estudiantesPerfilService.actualizarFotoPerfil(fotoUrl).pipe(
      map(() => fotoUrl)
    );
  }
}
