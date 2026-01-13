import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileRepository } from '../../../domain/repositories/profile.repository';
import { StudentProfile, SocialLinks } from '../../../domain/models/student-profile.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css',
})
export class ProfileEditComponent implements OnInit {
  // Signals
  profile = signal<StudentProfile | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  photoPreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  // Forms
  profileForm!: FormGroup;
  socialLinksForm!: FormGroup;

  // Computed
  hasChanges = computed(() => {
    return this.profileForm?.dirty || this.socialLinksForm?.dirty || this.selectedFile() !== null;
  });

  constructor(
    private fb: FormBuilder,
    private profileRepository: ProfileRepository,
    private router: Router,
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private initializeForms(): void {
    // Formulario de información personal
    this.profileForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, this.phoneValidator]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      biografia: ['', [Validators.maxLength(500)]],
      direccion: this.fb.group({
        departamento: ['', Validators.required],
        provincia: ['', Validators.required],
        distrito: ['', Validators.required],
        calle: ['', Validators.required],
        referencia: [''],
      }),
      contactoEmergencia: this.fb.group({
        nombre: ['', Validators.required],
        relacion: ['', Validators.required],
        telefono: ['', [Validators.required, this.phoneValidator]],
      }),
    });

    // Formulario de redes sociales
    this.socialLinksForm = this.fb.group({
      linkedin: ['', this.urlValidator],
      github: ['', this.urlValidator],
      instagram: ['', this.urlValidator],
      twitter: ['', this.urlValidator],
      facebook: ['', this.urlValidator],
      portfolio: ['', this.urlValidator],
      youtube: ['', this.urlValidator],
      medium: ['', this.urlValidator],
    });
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    const userId = '550e8400-e29b-41d4-a716-446655440000'; // TODO: Get from auth service

    this.profileRepository.getStudentProfile(userId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.photoPreview.set(profile.fotoUrl || null);
        this.populateForms(profile);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el perfil');
        this.isLoading.set(false);
        console.error('Error loading profile:', err);
      },
    });
  }

  private populateForms(profile: StudentProfile): void {
    this.profileForm.patchValue({
      nombres: profile.nombres,
      apellidoPaterno: profile.apellidoPaterno,
      apellidoMaterno: profile.apellidoMaterno,
      email: profile.email,
      telefono: profile.telefono,
      dni: profile.dni,
      biografia: profile.biografia || '',
      direccion: profile.direccion,
      contactoEmergencia: profile.contactoEmergencia,
    });

    this.socialLinksForm.patchValue(profile.redesSociales);
  }

  // Validadores personalizados
  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const phoneRegex = /^\+?[0-9]{9,15}$/;
    return phoneRegex.test(control.value) ? null : { invalidPhone: true };
  }

  private urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  }

  // Upload de foto
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private handleFile(file: File): void {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.error.set('El archivo debe ser una imagen');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('La imagen no debe superar 5MB');
      return;
    }

    this.selectedFile.set(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.error.set(null);
  }

  removePhoto(): void {
    this.selectedFile.set(null);
    this.photoPreview.set(this.profile()?.fotoUrl || null);
  }

  // Guardar cambios
  async saveChanges(): Promise<void> {
    if (this.profileForm.invalid || this.socialLinksForm.invalid) {
      this.error.set('Por favor corrige los errores en el formulario');
      this.markFormGroupTouched(this.profileForm);
      this.markFormGroupTouched(this.socialLinksForm);
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const userId = this.profile()?.id || '550e8400-e29b-41d4-a716-446655440000';

    try {
      // 1. Subir foto si hay una nueva
      if (this.selectedFile()) {
        await this.uploadPhoto(userId);
      }

      // 2. Actualizar perfil
      const profileData: Partial<StudentProfile> = {
        ...this.profileForm.value,
      };

      await this.profileRepository.updateProfile(userId, profileData).toPromise();

      // 3. Actualizar redes sociales
      const socialLinks: SocialLinks = this.socialLinksForm.value;
      await this.profileRepository.updateSocialLinks(userId, socialLinks).toPromise();

      this.successMessage.set('✅ Perfil actualizado exitosamente');
      this.profileForm.markAsPristine();
      this.socialLinksForm.markAsPristine();
      this.selectedFile.set(null);

      // Recargar perfil
      setTimeout(() => {
        this.loadProfile();
      }, 1000);
    } catch (err) {
      this.error.set('Error al guardar los cambios. Por favor intenta de nuevo.');
      console.error('Error saving profile:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  private async uploadPhoto(userId: string): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    try {
      await this.profileRepository.uploadProfilePhoto(userId, file).toPromise();
    } catch (err) {
      throw new Error('Error al subir la foto');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel(): void {
    if (this.hasChanges()) {
      if (confirm('¿Descartar los cambios realizados?')) {
        this.router.navigate(['/student/profile']);
      }
    } else {
      this.router.navigate(['/student/profile']);
    }
  }

  // Helpers para template
  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minLength'])
      return `Mínimo ${control.errors['minLength'].requiredLength} caracteres`;
    if (control.errors['maxLength'])
      return `Máximo ${control.errors['maxLength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Formato inválido';
    if (control.errors['invalidPhone']) return 'Teléfono inválido (formato: +51987654321)';
    if (control.errors['invalidUrl']) return 'URL inválida';

    return 'Campo inválido';
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
