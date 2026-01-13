import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ProfileRepository } from '../../domain/repositories/profile.repository';
import { StudentProfile, SocialLinks } from '../../domain/models/student-profile.model';
import { getMockStudentProfile } from '../../../../core/mock-data/student.mock';

/**
 * Implementación Mock del repositorio de perfil
 * Usa datos estáticos y localStorage para simular persistencia
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileMockRepositoryImpl extends ProfileRepository {
  private readonly STORAGE_KEY = 'student_profile';

  override getStudentProfile(studentId: string): Observable<StudentProfile> {
    console.log('👤 [PROFILE MOCK] Getting profile for student:', studentId);

    // Intentar cargar desde localStorage primero
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      console.log('✅ [PROFILE MOCK] Profile loaded from storage');
      return of(profile).pipe(delay(300));
    }

    // Si no existe, retornar datos mock por defecto
    const profile = getMockStudentProfile();
    console.log('✅ [PROFILE MOCK] Profile loaded from mock data');
    return of(profile).pipe(delay(300));
  }

  override updateProfile(
    studentId: string,
    profile: Partial<StudentProfile>,
  ): Observable<StudentProfile> {
    console.log('💾 [PROFILE MOCK] Updating profile for student:', studentId);

    // Obtener perfil actual
    const current = getMockStudentProfile();

    // Merge con los cambios
    const updated: StudentProfile = {
      ...current,
      ...profile,
      // Asegurar que objetos anidados se mergeen correctamente
      carrera: profile.carrera ? { ...current.carrera, ...profile.carrera } : current.carrera,
      direccion: profile.direccion
        ? { ...current.direccion, ...profile.direccion }
        : current.direccion,
      contactoEmergencia: profile.contactoEmergencia
        ? { ...current.contactoEmergencia, ...profile.contactoEmergencia }
        : current.contactoEmergencia,
      redesSociales: profile.redesSociales
        ? { ...current.redesSociales, ...profile.redesSociales }
        : current.redesSociales,
    };

    // Guardar en localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    console.log('✅ [PROFILE MOCK] Profile updated successfully');

    return of(updated).pipe(delay(500));
  }

  override updateSocialLinks(studentId: string, links: SocialLinks): Observable<SocialLinks> {
    console.log('🔗 [PROFILE MOCK] Updating social links for student:', studentId);

    // Obtener perfil actual
    const current = getMockStudentProfile();

    // Actualizar solo redes sociales
    const updated: StudentProfile = {
      ...current,
      redesSociales: { ...current.redesSociales, ...links },
    };

    // Guardar en localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    console.log('✅ [PROFILE MOCK] Social links updated successfully');

    return of(updated.redesSociales).pipe(delay(400));
  }

  override uploadProfilePhoto(studentId: string, file: File): Observable<string> {
    console.log('📸 [PROFILE MOCK] Uploading profile photo for student:', studentId);

    // Validar archivo
    if (!file.type.startsWith('image/')) {
      return throwError(() => new Error('El archivo debe ser una imagen'));
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      return throwError(() => new Error('La imagen no debe superar 5MB'));
    }

    // Convertir a base64 para simular upload
    return new Observable<string>((observer) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = reader.result as string;

        // Actualizar perfil con nueva foto
        const current = getMockStudentProfile();
        const updated: StudentProfile = {
          ...current,
          fotoUrl: base64,
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        console.log('✅ [PROFILE MOCK] Photo uploaded successfully');

        observer.next(base64);
        observer.complete();
      };

      reader.onerror = () => {
        observer.error(new Error('Error al leer el archivo'));
      };

      reader.readAsDataURL(file);
    }).pipe(delay(1000)); // Simular latencia de upload
  }
}
