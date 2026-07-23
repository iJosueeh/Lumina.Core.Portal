import { Component, EventEmitter, Input, Output, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService } from '../../../../../infrastructure/services/admin-user.service';
import { ModalContainerComponent } from '../../../../../../../shared/components/ui/modal-container/modal-container.component';

@Component({
  selector: 'app-admin-user-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalContainerComponent],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.css'
})
export class UserFormModalComponent implements OnDestroy {
  @Input({ required: true }) user!: any;
  @Input() isEditing = false;
  @Input() isSaving = false;
  @Input() saveError = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  private adminUserService = inject(AdminUserService);

  showPassword = signal(false);
  isCheckingEmail = false;
  emailAvailability: 'unknown' | 'available' | 'taken' = 'unknown';
  emailCheckMessage = '';
  private emailCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private emailCheckRequestId = 0;

  ngOnDestroy(): void {
    if (this.emailCheckTimer) clearTimeout(this.emailCheckTimer);
  }

  onEmailChange(value: string): void {
    this.user.email = value;
    if (this.isEditing) return;

    if (this.emailCheckTimer) clearTimeout(this.emailCheckTimer);

    const normalized = (value ?? '').trim();
    this.emailAvailability = 'unknown';
    this.emailCheckMessage = '';

    if (!normalized || !normalized.includes('@lumina.edu')) return;

    this.isCheckingEmail = true;
    const requestId = ++this.emailCheckRequestId;

    this.emailCheckTimer = setTimeout(() => {
      this.adminUserService.checkEmailExists(normalized).subscribe({
        next: (exists) => {
          if (requestId !== this.emailCheckRequestId) return;
          this.isCheckingEmail = false;
          this.emailAvailability = exists ? 'taken' : 'available';
          this.emailCheckMessage = exists ? 'Este correo ya está registrado.' : 'Correo disponible.';
        },
        error: () => {
          if (requestId !== this.emailCheckRequestId) return;
          this.isCheckingEmail = false;
          this.emailCheckMessage = 'Error al validar el correo.';
        }
      });
    }, 450);
  }

  isFormValid(): boolean {
    if (!this.user.email?.trim()) return false;
    if (!this.isEditing && (!this.user.password || this.user.password.length < 6)) return false;
    if (!this.user.nombresPersona?.trim()) return false;
    if (!this.user.apellidoPaterno?.trim()) return false;
    return true;
  }

  submit(): void {
    if (!this.isFormValid()) return;
    this.save.emit(this.user);
  }
}
