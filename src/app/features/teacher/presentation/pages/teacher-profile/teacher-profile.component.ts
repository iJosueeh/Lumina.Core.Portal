import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherProfile } from '@features/teacher/domain/models/teacher-profile.model';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-profile.component.html',
  styles: ``,
})
export class TeacherProfileComponent implements OnInit {
  profile$: Observable<TeacherProfile | null> = of(null);
  private profileSubject = new BehaviorSubject<TeacherProfile | null>(null);
  
  // Modal state
  isEditModalOpen = false;
  editForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private authRepository: AuthRepository,
    private fb: FormBuilder,
  ) {
    this.initEditForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Intentar cargar desde el archivo JSON, si no existe usar datos mock
    this.http
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
      )
      .subscribe((profile) => {
        this.profileSubject.next(profile);
      });

    this.profile$ = this.profileSubject.asObservable();
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

  private initEditForm(): void {
    this.editForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      bio: ['', [Validators.maxLength(500)]],
      phone: ['', [Validators.pattern(/^\+?\d{1,3}?\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
      department: [''],
    });
  }

  editProfile(): void {
    const currentProfile = this.profileSubject.value;
    if (currentProfile) {
      this.editForm.patchValue({
        fullName: currentProfile.fullName,
        bio: currentProfile.bio || '',
        phone: currentProfile.phone || '',
        department: currentProfile.department || '',
      });
    }
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
  }

  saveProfile(): void {
    if (this.editForm.valid) {
      const currentProfile = this.profileSubject.value;
      if (currentProfile) {
        const updatedProfile: TeacherProfile = {
          ...currentProfile,
          fullName: this.editForm.value.fullName,
          bio: this.editForm.value.bio,
          phone: this.editForm.value.phone,
          department: this.editForm.value.department,
        };
        
        // Actualizar el perfil
        this.profileSubject.next(updatedProfile);
        
        // En un escenario real, aquí se haría una petición HTTP al backend
        // this.http.put(`/api/teachers/${currentProfile.id}`, updatedProfile).subscribe(...)
        
        this.closeEditModal();
      }
    }
  }

  get bioCharCount(): number {
    return this.editForm.get('bio')?.value?.length || 0;
  }
}
