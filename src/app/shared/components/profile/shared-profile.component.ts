import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

interface UserProfile {
    // Common (from /api/users/profile)
    id: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email: string;
    fechaNacimiento: string;
    direccion: { pais: string; departamento: string; provincia: string; distrito: string; calle: string };
    rol: string;
    // Student-specific (from /api/perfil-estudiante)
    telefono?: string;
    dni?: string;
    biografia?: string;
    fotoUrl?: string;
    redesSociales?: {
        linkedIn?: string;
        gitHub?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        portfolio?: string;
        youTube?: string;
        tikTok?: string;
    };
    contactoEmergencia?: { nombre: string; relacion: string; telefono: string };
    // Academic (from Estudiantes API)
    codigo?: string;
    ciclo?: number;
    modalidad?: string;
    sede?: string;
    // Teacher-specific (from /api/docentes)
    cargo?: string;
    bio?: string;
    avatar?: string;
    linkedIn?: string;
    especialidadId?: string;
    docenteId?: string;
}

@Component({
    selector: 'app-shared-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './shared-profile.component.html'
})
export class SharedProfileComponent implements OnInit {
    private http = inject(HttpClient);
    private fb = inject(FormBuilder);
    private authRepository = inject(AuthRepository);

    profile = signal<UserProfile | null>(null);
    isLoading = signal(true);
    isSaving = signal(false);
    error = signal<string | null>(null);
    successMessage = signal<string | null>(null);
    activeTab = signal<'personal' | 'academic' | 'social' | 'password'>('personal');

    // Forms
    personalForm: FormGroup = this.fb.group({
        nombres: ['', Validators.required],
        apellidoPaterno: ['', Validators.required],
        apellidoMaterno: ['', Validators.required],
        fechaNacimiento: ['', Validators.required],
        pais: ['', Validators.required],
        departamento: ['', Validators.required],
        provincia: ['', Validators.required],
        distrito: ['', Validators.required],
        calle: ['', Validators.required]
    });

    studentInfoForm: FormGroup = this.fb.group({
        telefono: [''],
        dni: [''],
        biografia: ['']
    });

    emergencyForm: FormGroup = this.fb.group({
        nombre: ['', Validators.required],
        relacion: ['', Validators.required],
        telefono: ['', Validators.required]
    });

    socialForm: FormGroup = this.fb.group({
        linkedIn: [''],
        gitHub: [''],
        twitter: [''],
        facebook: [''],
        instagram: [''],
        portfolio: [''],
        youTube: [''],
        tikTok: ['']
    });

    teacherForm: FormGroup = this.fb.group({
        cargo: [''],
        bio: [''],
        linkedIn: ['']
    });

    passwordForm: FormGroup = this.fb.group({
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
    });

    isStudent = computed(() => this.profile()?.rol === 'Student');
    isTeacher = computed(() => this.profile()?.rol === 'Teacher');
    fullName = computed(() => {
        const p = this.profile();
        return p ? `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno}` : '';
    });

    ngOnInit(): void {
        this.loadProfile();
    }

    private getRoleFromJwt(): string {
        try {
            const user = this.authRepository.getCurrentUser();
            if (!user?.role) return '';
            // Map: 'STUDENT' → 'Student', 'TEACHER' → 'Teacher'
            const roleMap: Record<string, string> = {
                'STUDENT': 'Student',
                'TEACHER': 'Teacher',
                'ADMIN': 'Admin'
            };
            return roleMap[user.role] || user.role;
        } catch {
            return '';
        }
    }

    loadProfile(): void {
        this.isLoading.set(true);
        this.error.set(null);

        // Step 1: Load common profile
        this.http.get<{ success: boolean; data: any }>(
            `${environment.apiUrl}/users/profile`
        ).subscribe({
            next: (response) => {
                if (!response.success || !response.data) {
                    this.error.set('No se pudo cargar el perfil.');
                    this.isLoading.set(false);
                    return;
                }

                const profile: UserProfile = {
                    id: response.data.id,
                    nombres: response.data.nombresPersona || response.data.nombres,
                    apellidoPaterno: response.data.apellidoPaterno,
                    apellidoMaterno: response.data.apellidoMaterno,
                    email: response.data.email || response.data.correoElectronico,
                    fechaNacimiento: response.data.fechaNacimiento,
                    direccion: response.data.direccion || {
                        pais: response.data.pais || '',
                        departamento: response.data.departamento || '',
                        provincia: response.data.provincia || '',
                        distrito: response.data.distrito || '',
                        calle: response.data.calle || ''
                    },
                    rol: response.data.rolNombre || response.data.rol || this.getRoleFromJwt()
                };

                this.populatePersonalForm(profile);
                this.profile.set(profile);

                // Step 2: Load role-specific data
                if (profile.rol === 'Student') {
                    this.loadStudentProfile();
                } else if (profile.rol === 'Teacher') {
                    this.loadTeacherProfile(profile.id);
                } else {
                    this.isLoading.set(false);
                }
            },
            error: (err) => {
                console.error('Error loading profile:', err);
                this.error.set('No se pudo cargar el perfil.');
                this.isLoading.set(false);
            }
        });
    }

    loadStudentProfile(): void {
        this.http.get<any>(
            `${environment.apiUrl}/perfil-estudiante`
        ).subscribe({
            next: (data) => {
                const p = this.profile();
                if (p) {
                    p.telefono = data.telefono;
                    p.dni = data.dni;
                    p.biografia = data.biografia;
                    p.fotoUrl = data.fotoUrl;
                    p.redesSociales = data.redesSociales || {};
                    p.contactoEmergencia = data.contactoEmergencia;
                    p.codigo = data.codigo;
                    p.ciclo = data.ciclo;
                    p.modalidad = data.modalidad;
                    p.sede = data.sede;
                    this.profile.set({ ...p });
                    this.populateStudentForms(p);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.warn('Student profile not found, using defaults');
                this.isLoading.set(false);
            }
        });
    }

    loadTeacherProfile(userId: string): void {
        this.http.get<any>(
            `${environment.apiUrl}/docentes/by-usuario/${userId}`
        ).subscribe({
            next: (data) => {
                const p = this.profile();
                if (p) {
                    p.docenteId = data.id?.value || data.id;
                    p.cargo = data.cargo;
                    p.bio = data.bio;
                    p.avatar = data.avatar;
                    p.linkedIn = data.linkedIn;
                    p.especialidadId = data.especialidadId?.value || data.especialidadId;
                    this.profile.set({ ...p });
                    this.populateTeacherForm(p);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.warn('Teacher profile not found');
                this.isLoading.set(false);
            }
        });
    }

    populatePersonalForm(p: UserProfile): void {
        this.personalForm.patchValue({
            nombres: p.nombres,
            apellidoPaterno: p.apellidoPaterno,
            apellidoMaterno: p.apellidoMaterno,
            fechaNacimiento: p.fechaNacimiento?.split('T')[0] || '',
            pais: p.direccion?.pais || '',
            departamento: p.direccion?.departamento || '',
            provincia: p.direccion?.provincia || '',
            distrito: p.direccion?.distrito || '',
            calle: p.direccion?.calle || ''
        });
    }

    populateStudentForms(p: UserProfile): void {
        this.studentInfoForm.patchValue({
            telefono: p.telefono || '',
            dni: p.dni || '',
            biografia: p.biografia || ''
        });
        this.emergencyForm.patchValue({
            nombre: p.contactoEmergencia?.nombre || '',
            relacion: p.contactoEmergencia?.relacion || '',
            telefono: p.contactoEmergencia?.telefono || ''
        });
        this.socialForm.patchValue({
            linkedIn: p.redesSociales?.linkedIn || '',
            gitHub: p.redesSociales?.gitHub || '',
            twitter: p.redesSociales?.twitter || '',
            facebook: p.redesSociales?.facebook || '',
            instagram: p.redesSociales?.instagram || '',
            portfolio: p.redesSociales?.portfolio || '',
            youTube: p.redesSociales?.youTube || '',
            tikTok: p.redesSociales?.tikTok || ''
        });
    }

    populateTeacherForm(p: UserProfile): void {
        this.teacherForm.patchValue({
            cargo: p.cargo || '',
            bio: p.bio || '',
            linkedIn: p.linkedIn || ''
        });
    }

    setTab(tab: 'personal' | 'academic' | 'social' | 'password'): void {
        this.activeTab.set(tab);
        this.successMessage.set(null);
        this.error.set(null);
    }

    // === PUT: Common profile ===
    savePersonalInfo(): void {
        if (this.personalForm.invalid) return;
        this.isSaving.set(true);
        this.error.set(null);

        const v = this.personalForm.value;
        this.http.put<{ success: boolean }>(
            `${environment.apiUrl}/users/profile`,
            {
                nombresPersona: v.nombres,
                apellidoPaterno: v.apellidoPaterno,
                apellidoMaterno: v.apellidoMaterno,
                fechaNacimiento: new Date(v.fechaNacimiento).toISOString(),
                pais: v.pais,
                departamento: v.departamento,
                provincia: v.provincia,
                distrito: v.distrito,
                calle: v.calle
            }
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.successMessage.set('Información personal actualizada.');
                this.loadProfile();
            },
            error: () => {
                this.isSaving.set(false);
                this.error.set('No se pudo actualizar la información personal.');
            }
        });
    }

    // === PUT: Student info (telefono, DNI, biografía) ===
    saveStudentInfo(): void {
        this.isSaving.set(true);
        this.error.set(null);

        const v = this.studentInfoForm.value;
        this.http.put<{ success: boolean }>(
            `${environment.apiUrl}/perfil-estudiante/personal`,
            {
                telefono: v.telefono,
                dni: v.dni,
                biografia: v.biografia
            }
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.successMessage.set('Información de estudiante actualizada.');
                this.loadStudentProfile();
            },
            error: () => {
                this.isSaving.set(false);
                this.error.set('No se pudo actualizar la información.');
            }
        });
    }

    // === PUT: Emergency contact ===
    saveEmergencyContact(): void {
        if (this.emergencyForm.invalid) return;
        this.isSaving.set(true);
        this.error.set(null);

        const v = this.emergencyForm.value;
        this.http.put<{ success: boolean }>(
            `${environment.apiUrl}/perfil-estudiante/contacto-emergencia`,
            {
                nombre: v.nombre,
                relacion: v.relacion,
                telefono: v.telefono
            }
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.successMessage.set('Contacto de emergencia actualizado.');
                this.loadStudentProfile();
            },
            error: () => {
                this.isSaving.set(false);
                this.error.set('No se pudo actualizar el contacto.');
            }
        });
    }

    // === PUT: Social links (Student) ===
    saveSocialLinks(): void {
        this.isSaving.set(true);
        this.error.set(null);

        const v = this.socialForm.value;
        this.http.put<{ success: boolean }>(
            `${environment.apiUrl}/perfil-estudiante/redes-sociales`,
            {
                linkedIn: v.linkedIn,
                gitHub: v.gitHub,
                twitter: v.twitter,
                facebook: v.facebook,
                instagram: v.instagram,
                portfolio: v.portfolio,
                youTube: v.youTube,
                tikTok: v.tikTok
            }
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.successMessage.set('Redes sociales actualizadas.');
                this.loadStudentProfile();
            },
            error: () => {
                this.isSaving.set(false);
                this.error.set('No se pudieron actualizar las redes sociales.');
            }
        });
    }

    // === PUT: Teacher profile (cargo, bio, linkedIn) ===
    saveTeacherInfo(): void {
        const p = this.profile();
        if (!p?.docenteId) return;

        this.isSaving.set(true);
        this.error.set(null);

        const v = this.teacherForm.value;
        this.http.put<{ success: boolean }>(
            `${environment.apiUrl}/docentes/${p.docenteId}`,
            {
                especialidadId: p.especialidadId,
                nombre: this.fullName(),
                cargo: v.cargo,
                bio: v.bio,
                avatar: p.avatar,
                linkedIn: v.linkedIn
            }
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.successMessage.set('Perfil docente actualizado.');
                this.loadTeacherProfile(p.id);
            },
            error: () => {
                this.isSaving.set(false);
                this.error.set('No se pudo actualizar el perfil docente.');
            }
        });
    }

    // === PUT: Photo ===
    savePhoto(url: string): void {
        this.http.put<{ success: boolean }>(
            `${environment.apiUrl}/perfil-estudiante/foto`,
            { fotoUrl: url }
        ).subscribe({
            next: () => {
                const p = this.profile();
                if (p) {
                    p.fotoUrl = url;
                    this.profile.set({ ...p });
                }
                this.successMessage.set('Foto de perfil actualizada.');
            }
        });
    }

    // === PUT: Password ===
    changePassword(): void {
        if (this.passwordForm.invalid) return;
        const { newPassword, confirmPassword } = this.passwordForm.value;
        if (newPassword !== confirmPassword) {
            this.error.set('Las contraseñas no coinciden.');
            return;
        }

        this.isSaving.set(true);
        this.error.set(null);

        this.http.put<{ success: boolean }>(
            `${environment.apiUrl}/users/change-password`,
            {
                currentPassword: this.passwordForm.value.currentPassword,
                newPassword
            }
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.successMessage.set('Contraseña cambiada correctamente.');
                this.passwordForm.reset();
            },
            error: () => {
                this.isSaving.set(false);
                this.error.set('No se pudo cambiar la contraseña. Verifica la actual.');
            }
        });
    }
}
