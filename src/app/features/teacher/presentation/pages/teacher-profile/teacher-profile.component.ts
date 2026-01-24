import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherProfile } from '@features/teacher/domain/models/teacher-profile.model';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-profile.component.html',
  styles: ``,
})
export class TeacherProfileComponent implements OnInit {
  profile$: Observable<TeacherProfile | null> = of(null);

  constructor(
    private http: HttpClient,
    private authRepository: AuthRepository,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Intentar cargar desde el archivo JSON, si no existe usar datos mock
    this.profile$ = this.http
      .get<TeacherProfile>('/assets/mock-data/teachers/teacher-profile.json')
      .pipe(
        catchError(() => {
          // Si no existe el archivo, generar datos mock basados en el usuario actual
          return of(this.generateMockProfile(currentUser));
        }),
        map((profile) => {
          // Asegurar que fullName y email estén mapeados correctamente
          return {
            ...profile,
            id: currentUser.id,
            email: currentUser.email,
            fullName: currentUser.fullName,
            role: currentUser.role,
          };
        }),
      );
  }

  private generateMockProfile(user: any): TeacherProfile {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      bio: 'Profesor dedicado con más de 10 años de experiencia en educación superior. Especializado en metodologías de enseñanza innovadoras y comprometido con el éxito académico de los estudiantes.',
      phone: '+51 987 654 321',
      department: 'Ingeniería de Sistemas',
      stats: {
        cursosAsignados: 5,
        alumnosTotales: 142,
        promedioGeneral: 15.8,
        evaluacionesPendientes: 12,
      },
    };
  }

  getInitials(fullName: string): string {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  editProfile(): void {
    console.log('Editar perfil');
    // TODO: Implementar funcionalidad de edición
  }
}
