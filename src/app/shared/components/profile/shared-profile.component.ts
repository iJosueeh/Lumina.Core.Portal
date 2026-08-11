import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

interface UserProfile {
    id: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email: string;
    fechaNacimiento: string;
    direccion: {
        pais: string;
        departamento: string;
        provincia: string;
        distrito: string;
        calle: string;
    };
    rol: string;
    // Student-specific
    codigo?: string;
    ciclo?: number;
    modalidad?: string;
    sede?: string;
    // Teacher-specific
    cargo?: string;
    bio?: string;
    avatar?: string;
    linkedIn?: string;
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
    isEditing = signal(false);

    profileForm: FormGroup = this.fb.group({
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

    passwordForm: FormGroup = this.fb.group({
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
    });

    isStudent = computed(() => this.profile()?.rol === 'Student');
    isTeacher = computed(() => this.profile()?.rol === 'Teacher');
    isAdmin = computed(() => this.profile()?.rol === 'Admin');

    fullName = computed(() => {
        const p = this.profile();
        return p ? `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno}` : '';
    });

    ngOnInit(): void {
        this.loadProfile();
    }

    loadProfile(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.http.get<{ success: boolean; data: UserProfile }>(
            `${environment.apiUrl}/users/profile`
        ).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.profile.set(response.data);
                    this.populateForm(response.data);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading profile:', err);
                this.error.set('No se pudo cargar el perfil.');
                this.isLoading.set(false);
            }
        });
    }

    populateForm(profile: UserProfile): void {
        this.profileForm.patchValue({
            nombres: profile.nombres,
            apellidoPaterno: profile.apellidoPaterno,
            apellidoMaterno: profile.apellidoMaterno,
            fechaNacimiento: profile.fechaNacimiento?.split('T')[0] || '',
            pais: profile.direccion?.pais || '',
            departamento: profile.direccion?.departamento || '',
            provincia: profile.direccion?.provincia || '',
            distrito: profile.direccion?.distrito || '',
            calle: profile.direccion?.calle || ''
        });
    }

    toggleEdit(): void {
        this.isEditing.set(!this.isEditing());
        this.successMessage.set(null);
        if (!this.isEditing() && this.profile()) {
            this.populateForm(this.profile()!);
        }
    }

    saveProfile(): void {
        if (this.profileForm.invalid) return;

        this.isSaving.set(true);
        this.error.set(null);

        const formValue = this.profileForm.value;

        this.http.put<{ success: boolean; message: string }>(
            `${environment.apiUrl}/users/profile`,
            {
                nombresPersona: formValue.nombres,
                apellidoPaterno: formValue.apellidoPaterno,
                apellidoMaterno: formValue.apellidoMaterno,
                fechaNacimiento: new Date(formValue.fechaNacimiento).toISOString(),
                pais: formValue.pais,
                departamento: formValue.departamento,
                provincia: formValue.provincia,
                distrito: formValue.distrito,
                calle: formValue.calle
            }
        ).subscribe({
            next: (response) => {
                this.isSaving.set(false);
                this.isEditing.set(false);
                this.successMessage.set('Perfil actualizado correctamente.');
                this.loadProfile();
            },
            error: (err) => {
                this.isSaving.set(false);
                this.error.set('No se pudo actualizar el perfil.');
            }
        });
    }

    changePassword(): void {
        if (this.passwordForm.invalid) return;

        const { newPassword, confirmPassword } = this.passwordForm.value;
        if (newPassword !== confirmPassword) {
            this.error.set('Las contraseñas no coinciden.');
            return;
        }

        this.isSaving.set(true);
        this.error.set(null);

        this.http.put<{ success: boolean; message: string }>(
            `${environment.apiUrl}/users/change-password`,
            {
                currentPassword: this.passwordForm.value.currentPassword,
                newPassword: newPassword
            }
        ).subscribe({
            next: (response) => {
                this.isSaving.set(false);
                this.successMessage.set('Contraseña cambiada correctamente.');
                this.passwordForm.reset();
            },
            error: (err) => {
                this.isSaving.set(false);
                this.error.set('No se pudo cambiar la contraseña. Verifica la contraseña actual.');
            }
        });
    }
}
