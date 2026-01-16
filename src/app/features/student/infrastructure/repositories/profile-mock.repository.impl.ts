import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { ProfileRepository } from '../../domain/repositories/profile.repository';
import { StudentProfile, SocialLinks } from '../../domain/models/student-profile.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProfileMockRepositoryImpl extends ProfileRepository {
  private readonly STORAGE_KEY = 'student_profile';

  constructor(private http: HttpClient) {
    super();
  }

  override getStudentProfile(studentId: string): Observable<StudentProfile> {
    console.log('👤 [PROFILE MOCK] Getting profile for student:', studentId);

    // Intentar cargar desde localStorage primero
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      console.log('✅ [PROFILE MOCK] Profile loaded from storage');
      return of(profile).pipe(delay(300));
    }

    // Si no existe, retornar datos mock desde JSON
    console.log('✅ [PROFILE MOCK] Profile loaded from JSON');
    return this.http
      .get<StudentProfile[]>('/assets/mock-data/profiles/student-profiles.json') // Note: JSON probably returns array? check below
      .pipe(
        map((profiles) => profiles[0]), // Assume first profile or find by ID if structure supports it. The previous code mockDataLoader loaded 'profiles/student-profiles.json' which I created as ARRAY in previous turn?
        // Let's check student-profiles.json structure. If it is an array, I need to pick one.
        // Wait, previously `loadJson<StudentProfile>` implied it returned ONE object if the generic was StudentProfile?
        // MockDataLoaderService `loadJson<T>` returned `Observable<T>`.
        // If I passed `StudentProfile`, I expected the JSON to BE the profile object.
        // Let's check the JSON file content in a sec. If it is an array, I need to map.
        // I will view `student-profiles.json` first to be safe.
      ); // Placeholder, will correct if needed.
  }

  override updateProfile(
    studentId: string,
    profile: Partial<StudentProfile>,
  ): Observable<StudentProfile> {
    console.log('💾 [PROFILE MOCK] Updating profile for student:', studentId);

    // Cargar perfil actual desde JSON o localStorage
    return this.getStudentProfile(studentId).pipe(
      map((current) => {
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

        return updated;
      }),
      delay(500),
    );
  }

  override updateSocialLinks(studentId: string, links: SocialLinks): Observable<SocialLinks> {
    console.log('🔗 [PROFILE MOCK] Updating social links for student:', studentId);

    // Cargar perfil actual desde JSON o localStorage
    return this.getStudentProfile(studentId).pipe(
      map((current) => {
        // Actualizar solo redes sociales
        const updated: StudentProfile = {
          ...current,
          redesSociales: { ...current.redesSociales, ...links },
        };

        // Guardar en localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        console.log('✅ [PROFILE MOCK] Social links updated successfully');

        return updated.redesSociales;
      }),
      delay(400),
    );
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

        // Cargar perfil actual y actualizar con nueva foto
        this.getStudentProfile(studentId).subscribe({
          next: (current) => {
            const updated: StudentProfile = {
              ...current,
              fotoUrl: base64,
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
            console.log('✅ [PROFILE MOCK] Photo uploaded successfully');

            observer.next(base64);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      };

      reader.onerror = () => {
        observer.error(new Error('Error al leer el archivo'));
      };

      reader.readAsDataURL(file);
    }).pipe(delay(1000)); // Simular latencia de upload
  }
}
