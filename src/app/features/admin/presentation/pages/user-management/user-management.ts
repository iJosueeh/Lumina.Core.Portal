import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService } from '../../../infrastructure/services/admin-user.service';
import { AdminUser } from '@shared/models/admin-user.models';
import { NotificationService } from '../../../../../shared/services/notification.service';

// Sub-components
import { UserTableComponent } from './components/user-table/user-table.component';
import { UserFormModalComponent } from './components/user-form-modal/user-form-modal.component';
import { ConfirmDeleteModalComponent } from '../../../../../shared/components/ui/confirm-delete-modal/confirm-delete-modal.component';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule, UserTableComponent, UserFormModalComponent, ConfirmDeleteModalComponent],
    templateUrl: './user-management.html',
    styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
    private adminService = inject(AdminUserService);
    private notificationService = inject(NotificationService);

    // State Signals
    allUsers = signal<AdminUser[]>([]);
    isLoading = signal(false);
    searchTerm = signal('');

    selectedRole = signal('Rol: Todos');
    selectedStatus = signal('Estado: Todos');

    // Pagination
    currentPage = signal(1);
    itemsPerPage = 5;

    // Create/Edit Modal State
    isModalOpen = signal(false);
    isEditing = signal(false);
    isSaving = signal(false);
    saveError = signal('');
    currentUser: any = this.getEmptyUser();

    // Delete Modal State
    showDeleteModal = signal(false);
    userToDelete = signal<AdminUser | null>(null);
    isDeleting = signal(false);

    // Reset Password Modal State
    showResetModal = signal(false);
    userToReset = signal<AdminUser | null>(null);
    newPassword = signal('');
    confirmPassword = signal('');
    showPassword = signal(false);
    showConfirmPassword = signal(false);
    isResetting = signal(false);
    resetError = signal('');
    passwordsMatch = computed(() =>
        this.newPassword().length > 0 &&
        this.confirmPassword().length > 0 &&
        this.newPassword() === this.confirmPassword()
    );

    // Computed
    filteredUsers = computed(() => {
        let temp = [...this.allUsers()];
        const term = this.searchTerm().toLowerCase();
        
        if (term) {
            temp = temp.filter(u =>
                u.fullName.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                u.id.toLowerCase().includes(term)
            );
        }

        const role = this.selectedRole();
        if (role !== 'Rol: Todos') {
            const roleMap: Record<string, string> = { 'Estudiante': 'STUDENT', 'Docente': 'TEACHER', 'Admin': 'ADMIN' };
            temp = temp.filter(u => u.role === (roleMap[role] || role));
        }

        const status = this.selectedStatus();
        if (status !== 'Estado: Todos') {
            const statusMap: Record<string, string> = { 'Activo': 'ACTIVE', 'Suspendido': 'SUSPENDED' };
            temp = temp.filter(u => u.status === (statusMap[status] || status));
        }
        return temp;
    });

    paginatedUsers = computed(() => {
        const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
        return this.filteredUsers().slice(startIndex, startIndex + this.itemsPerPage);
    });

    totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.itemsPerPage) || 1);

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading.set(true);
        this.adminService.getUsers().subscribe({
            next: (users) => {
                this.allUsers.set(users);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    openAddUserModal(): void {
        this.isEditing.set(false);
        this.currentUser = this.getEmptyUser();
        this.saveError.set('');
        this.isModalOpen.set(true);
    }

    openEditUserModal(user: AdminUser): void {
        this.isEditing.set(true);
        this.currentUser = { ...user };
        this.saveError.set('');
        this.isModalOpen.set(true);
    }

    saveUser(userData: any): void {
        this.isSaving.set(true);
        // Lógica de persistencia...
        this.isModalOpen.set(false);
        this.isSaving.set(false);
    }

    deleteUser(user: AdminUser): void {
        this.userToDelete.set(user);
        this.showDeleteModal.set(true);
    }

    confirmDelete(): void {
        const user = this.userToDelete();
        if (!user) return;

        this.isDeleting.set(true);
        this.adminService.deleteUser(user.id).subscribe({
            next: () => {
                this.allUsers.update(users => users.filter(u => u.id !== user.id));
                this.notificationService.show('success', `Usuario ${user.fullName} eliminado`);
                this.closeDeleteModal();
            },
            error: (err) => {
                this.notificationService.show('error', err.error?.message || 'Error al eliminar usuario');
                this.isDeleting.set(false);
            }
        });
    }

    closeDeleteModal(): void {
        this.showDeleteModal.set(false);
        this.userToDelete.set(null);
        this.isDeleting.set(false);
    }

    clearFilter(): void {
        this.searchTerm.set('');
        this.selectedRole.set('Rol: Todos');
        this.selectedStatus.set('Estado: Todos');
        this.currentPage.set(1);
    }

    // --- Reset Password ---

    openResetModal(user: AdminUser): void {
        this.userToReset.set(user);
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.showPassword.set(false);
        this.showConfirmPassword.set(false);
        this.resetError.set('');
        this.showResetModal.set(true);
    }

    closeResetModal(): void {
        this.showResetModal.set(false);
        this.userToReset.set(null);
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.showPassword.set(false);
        this.showConfirmPassword.set(false);
        this.resetError.set('');
    }

    confirmReset(): void {
        const user = this.userToReset();
        if (!user) return;

        const pwd = this.newPassword();
        const confirm = this.confirmPassword();

        if (pwd.length < 6) {
            this.resetError.set('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (pwd !== confirm) {
            this.resetError.set('Las contraseñas no coinciden.');
            return;
        }

        this.isResetting.set(true);
        this.resetError.set('');

        this.adminService.resetPassword(user.email, pwd).subscribe({
            next: () => {
                this.notificationService.show('success', `Contraseña actualizada para ${user.email}`);
                this.closeResetModal();
                this.isResetting.set(false);
            },
            error: (err) => {
                this.resetError.set(err.error?.message || 'Error al resetear contraseña.');
                this.isResetting.set(false);
            }
        });
    }

    private getEmptyUser(): any {
        return {
            email: '',
            password: '',
            nombresPersona: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            role: 'STUDENT',
            status: 'ACTIVE'
        };
    }
}
