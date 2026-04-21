import { Component, EventEmitter, Input, Output, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../../infrastructure/services/admin.service';
import { AdminUser } from '@shared/models/admin-user.models';
import { ModalContainerComponent } from '../../../../../../../shared/components/ui/modal-container/modal-container.component';
import { ButtonComponent } from '../../../../../../../shared/components/ui/button/button.component';
import { FormFieldComponent } from '../../../../../../../shared/components/ui/form-field/form-field.component';
import { InputComponent } from '../../../../../../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../../../../../../shared/components/ui/select/select.component';

@Component({
  selector: 'app-admin-user-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalContainerComponent, ButtonComponent, FormFieldComponent, InputComponent, SelectComponent],
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

  private adminService = inject(AdminService);
  
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

    const normalizedEmail = (value ?? '').trim();
    this.emailAvailability = 'unknown';
    this.emailCheckMessage = '';
    
    if (!normalizedEmail || !normalizedEmail.includes('@lumina.edu')) return;

    this.isCheckingEmail = true;
    const requestId = ++this.emailCheckRequestId;

    this.emailCheckTimer = setTimeout(() => {
      this.adminService.checkEmailExists(normalizedEmail).subscribe({
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

  submit(): void {
    this.save.emit(this.user);
  }
}
