import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../infrastructure/services/admin.service';

@Component({
    selector: 'app-user-management',
    imports: [CommonModule, FormsModule],
    templateUrl: './user-management.html',
    styleUrl: './user-management.css',
})
export class UserManagement implements OnInit, OnDestroy {
    allUsers: any[] = [];
    filteredUsers: any[] = [];
    paginatedUsers: any[] = [];

    // Filters
    searchTerm = '';
    selectedRole = 'Rol: Todos';
    selectedStatus = 'Estado: Todos';

    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalPages = 1;
    totalItems = 0;

    // Modals
    isModalOpen = false;
    isDeleteModalOpen = false;

    // Form/Action Data
    currentUser: any = { fullName: '', email: '', role: 'STUDENT', department: '' }; // for add/edit
    userToDelete: any = null;
    isEditing = false;
    isLoading = false;
    isSaving = false;
    saveError = '';
    saveSuccess = '';
    showValidationErrors = false;
    isCheckingEmail = false;
    emailAvailability: 'unknown' | 'available' | 'taken' = 'unknown';
    emailCheckMessage = '';
    isCreateSuccessModalOpen = false;
    createdUserSummary: {
        fullName: string;
        email: string;
        role: string;
        department: string;
        password: string;
        isGeneratedPassword: boolean;
    } | null = null;
    readonly defaultGeneratedPassword = 'Temporal@1234';
    private emailCheckTimer: ReturnType<typeof setTimeout> | null = null;
    private emailCheckRequestId = 0;

    constructor(private adminService: AdminService) { }

    ngOnInit(): void {
        this.startLoading();
    }

    ngOnDestroy(): void {
        if (this.emailCheckTimer) {
            clearTimeout(this.emailCheckTimer);
            this.emailCheckTimer = null;
        }
    }

    startLoading() {
        this.isLoading = true;
        this.adminService.getUsers().subscribe({
            next: (users) => {
                this.allUsers = users;
                this.applyFilters();
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
        });
    }

    applyFilters() {
        let temp = [...this.allUsers];

        // Search
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            temp = temp.filter(u =>
                u.fullName.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                (u.id && u.id.toLowerCase().includes(term))
            );
        }

        // Role Filter
        if (this.selectedRole !== 'Rol: Todos') {
            const roleMap: Record<string, string> = { 'Estudiante': 'STUDENT', 'Docente': 'TEACHER', 'Admin': 'ADMIN' };
            // Simple mapping based on the select options in HTML
            const mappedRole = roleMap[this.selectedRole] || this.selectedRole;
            temp = temp.filter(u => u.role === mappedRole);
        }

        // Status Filter
        if (this.selectedStatus !== 'Estado: Todos') {
            const statusMap: Record<string, string> = { 'Activo': 'ACTIVE', 'Suspendido': 'SUSPENDED' };
            const mappedStatus = statusMap[this.selectedStatus] || this.selectedStatus;
            temp = temp.filter(u => u.status === mappedStatus);
        }

        this.filteredUsers = temp;
        this.totalItems = this.filteredUsers.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.goToPage(1); // Reset to page 1 on filter change
    }

    goToPage(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        const startIndex = (page - 1) * this.itemsPerPage;
        this.paginatedUsers = this.filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);
    }

    // Actions
    openAddUserModal() {
        this.isEditing = false;
        this.currentUser = {
            fullName: '',
            email: '',
            role: 'STUDENT',
            department: '',
            status: 'ACTIVE',
            password: '',
            nombresPersona: '',
            apellidoPaterno: '',
            apellidoMaterno: ''
        };
        this.saveError = '';
        this.saveSuccess = '';
        this.showValidationErrors = false;
        this.isCheckingEmail = false;
        this.emailAvailability = 'unknown';
        this.emailCheckMessage = '';
        this.isModalOpen = true;
    }

    openEditUserModal(user: any) {
        this.isEditing = true;
        this.currentUser = { ...user }; // Copy
        this.saveError = '';
        this.saveSuccess = '';
        this.showValidationErrors = false;
        this.isCheckingEmail = false;
        this.emailAvailability = 'unknown';
        this.emailCheckMessage = '';
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.isSaving = false;
        this.saveError = '';
        if (this.emailCheckTimer) {
            clearTimeout(this.emailCheckTimer);
            this.emailCheckTimer = null;
        }
        this.isCheckingEmail = false;
    }

    closeCreateSuccessModal(): void {
        this.isCreateSuccessModalOpen = false;
        this.createdUserSummary = null;
    }

    onEmailInputChange(value: string): void {
        this.currentUser.email = value;

        if (this.isEditing) return;

        if (this.emailCheckTimer) {
            clearTimeout(this.emailCheckTimer);
            this.emailCheckTimer = null;
        }

        const normalizedEmail = (value ?? '').trim();
        this.emailAvailability = 'unknown';
        this.emailCheckMessage = '';
        this.isCheckingEmail = false;

        if (!normalizedEmail || !this.isInstitutionalEmail(normalizedEmail)) {
            return;
        }

        this.isCheckingEmail = true;
        const requestId = ++this.emailCheckRequestId;

        // Debounce to avoid sending a request for each key press.
        this.emailCheckTimer = setTimeout(() => {
            this.adminService.checkEmailExists(normalizedEmail).subscribe({
                next: (exists) => {
                    if (requestId !== this.emailCheckRequestId) return;
                    this.isCheckingEmail = false;
                    this.emailAvailability = exists ? 'taken' : 'available';
                    this.emailCheckMessage = exists
                        ? 'Este correo ya esta registrado.'
                        : 'Correo disponible.';
                },
                error: () => {
                    if (requestId !== this.emailCheckRequestId) return;
                    this.isCheckingEmail = false;
                    this.emailAvailability = 'unknown';
                    this.emailCheckMessage = 'No se pudo validar el correo en este momento.';
                }
            });
        }, 450);
    }

    private isValidPersonText(value: string): boolean {
        // Allows letters, spaces and common name separators.
        return /^[A-Za-zÀ-ÿ' -]{2,}$/.test(value.trim());
    }

    private isInstitutionalEmail(value: string): boolean {
        return /^[^\s@]+@lumina\.edu$/i.test(value.trim());
    }

    private isStrongPassword(value: string): boolean {
        if (!value) return true; // Optional in UI; backend will assign default when empty.
        const hasMinLength = value.length >= 8;
        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);
        return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }

    getValidationErrors(): string[] {
        const errors: string[] = [];
        const email = (this.currentUser?.email ?? '').trim();
        const role = (this.currentUser?.role ?? '').trim();

        if (!role) errors.push('Selecciona un rol.');

        if (this.isEditing) {
            const fullName = (this.currentUser?.fullName ?? '').trim();
            if (!fullName) {
                errors.push('El nombre completo es obligatorio.');
            }
        } else {
            const nombres = (this.currentUser?.nombresPersona ?? '').trim();
            const apellidoPaterno = (this.currentUser?.apellidoPaterno ?? '').trim();
            const apellidoMaterno = (this.currentUser?.apellidoMaterno ?? '').trim();

            if (!nombres || !this.isValidPersonText(nombres)) {
                errors.push('Nombres debe tener al menos 2 caracteres y solo letras.');
            }
            if (!apellidoPaterno || !this.isValidPersonText(apellidoPaterno)) {
                errors.push('Apellido paterno debe tener al menos 2 caracteres y solo letras.');
            }
            if (!apellidoMaterno || !this.isValidPersonText(apellidoMaterno)) {
                errors.push('Apellido materno debe tener al menos 2 caracteres y solo letras.');
            }

            const password = (this.currentUser?.password ?? '').trim();
            if (!this.isStrongPassword(password)) {
                errors.push('La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo.');
            }
        }

        if (!email || !this.isInstitutionalEmail(email)) {
            errors.push('El correo debe ser institucional y terminar en @lumina.edu.');
        } else if (!this.isEditing) {
            if (this.isCheckingEmail) {
                errors.push('Espera la validacion de disponibilidad del correo.');
            } else if (this.emailAvailability === 'taken') {
                errors.push('El correo ingresado ya existe.');
            }
        }

        return errors;
    }

    canSaveUser(): boolean {
        return this.getValidationErrors().length === 0;
    }

    private extractErrorMessage(error: any): string {
        const validationErrors = error?.error?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
            const flattenedMessages: string[] = [];
            for (const key of Object.keys(validationErrors)) {
                const keyErrors = validationErrors[key];
                if (Array.isArray(keyErrors)) {
                    flattenedMessages.push(...keyErrors);
                }
            }
            if (flattenedMessages.length > 0) {
                return flattenedMessages.join(' ');
            }
        }

        const backendCode = error?.error?.code ?? error?.error?.Code;
        const backendName = error?.error?.name ?? error?.error?.Name;
        if (backendCode || backendName) {
            return `${backendCode ? `[${backendCode}] ` : ''}${backendName ?? ''}`.trim();
        }

        return error?.error?.message
            ?? error?.error?.detail
            ?? error?.error?.title
            ?? (typeof error?.error === 'string' ? error.error : '')
            ?? 'No se pudo guardar el usuario. Verifica los datos e intenta nuevamente.';
    }

    saveUser() {
        this.saveError = '';
        this.saveSuccess = '';
        this.showValidationErrors = true;

        if (!this.canSaveUser()) {
            this.saveError = 'Corrige las validaciones del formulario para continuar.';
            return;
        }

        if (!this.isEditing) {
            const nombres = (this.currentUser.nombresPersona ?? '').trim();
            const apellidoPaterno = (this.currentUser.apellidoPaterno ?? '').trim();
            const apellidoMaterno = (this.currentUser.apellidoMaterno ?? '').trim();
            this.currentUser.fullName = `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        }

        this.isSaving = true;

        if (this.isEditing) {
            this.adminService.updateUser(this.currentUser).subscribe({
                next: (success) => {
                    if (success) {
                        const index = this.allUsers.findIndex(u => u.id === this.currentUser.id);
                        if (index !== -1) {
                            // Actualizar el usuario en la lista local
                            this.allUsers[index] = { ...this.allUsers[index], ...this.currentUser };
                            this.applyFilters();
                        }
                        this.isSaving = false;
                        this.saveSuccess = 'Usuario actualizado correctamente.';
                        this.closeModal();
                        console.log('✅ Usuario actualizado exitosamente');
                    } else {
                        this.isSaving = false;
                        console.error('❌ Error al actualizar usuario');
                        this.saveError = 'Error al actualizar el usuario. Verifica los datos e intenta nuevamente.';
                    }
                },
                error: (err) => {
                    this.isSaving = false;
                    console.error('❌ Error en la petición:', err);
                    this.saveError = this.extractErrorMessage(err);
                }
            });
        } else {
            const enteredPassword = (this.currentUser.password ?? '').trim();
            const effectivePassword = enteredPassword || this.defaultGeneratedPassword;
            const fullName = (this.currentUser.fullName ?? '').trim();
            const email = (this.currentUser.email ?? '').trim();
            const role = (this.currentUser.role ?? '').trim();
            const department = (this.currentUser.department ?? '').trim();

            this.adminService.createUser(this.currentUser).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.saveSuccess = 'Usuario creado correctamente.';
                    this.closeModal();
                    this.createdUserSummary = {
                        fullName,
                        email,
                        role,
                        department,
                        password: effectivePassword,
                        isGeneratedPassword: !enteredPassword
                    };
                    this.isCreateSuccessModalOpen = true;
                    this.startLoading();
                },
                error: (err) => {
                    this.isSaving = false;
                    this.saveError = this.extractErrorMessage(err);
                }
            });
        }
    }

    openDeleteModal(user: any) {
        this.userToDelete = user;
        this.isDeleteModalOpen = true;
    }

    confirmDelete() {
        if (this.userToDelete) {
            this.adminService.deleteUser(this.userToDelete.id).subscribe({
                next: (success) => {
                    if (success) {
                        this.allUsers = this.allUsers.filter(u => u.id !== this.userToDelete.id);
                        this.applyFilters();
                        this.isDeleteModalOpen = false;
                        this.userToDelete = null;
                        console.log('✅ Usuario eliminado exitosamente');
                    } else {
                        console.error('❌ Error al eliminar usuario');
                        alert('Error al eliminar el usuario. Por favor, intenta nuevamente.');
                        this.isDeleteModalOpen = false;
                    }
                },
                error: (err) => {
                    console.error('❌ Error en la petición:', err);
                    alert('Error al eliminar el usuario. Por favor, intenta nuevamente.');
                    this.isDeleteModalOpen = false;
                }
            });
        }
    }

    // Selection
    selectedUsers: Set<string> = new Set();

    toggleSelection(userId: string) {
        if (this.selectedUsers.has(userId)) {
            this.selectedUsers.delete(userId);
        } else {
            this.selectedUsers.add(userId);
        }
    }

    toggleSelectAll(event: any) {
        if (event.target.checked) {
            this.paginatedUsers.forEach(u => this.selectedUsers.add(u.id));
        } else {
            this.selectedUsers.clear();
        }
    }

    isAllSelected(): boolean {
        return this.paginatedUsers.length > 0 && this.paginatedUsers.every(u => this.selectedUsers.has(u.id));
    }

    isSelected(userId: string): boolean {
        return this.selectedUsers.has(userId);
    }

    // Confirmation Modal
    isConfirmModalOpen = false;
    confirmMessage = '';
    confirmAction: (() => void) | null = null;
    confirmTitle = 'Confirmar Acción';

    openConfirmModal(title: string, message: string, action: () => void) {
        this.confirmTitle = title;
        this.confirmMessage = message;
        this.confirmAction = action;
        this.isConfirmModalOpen = true;
    }

    closeConfirmModal() {
        this.isConfirmModalOpen = false;
        this.confirmAction = null;
    }

    executeConfirmAction() {
        if (this.confirmAction) {
            this.confirmAction();
        }
        this.closeConfirmModal();
    }

    // Bulk Actions
    bulkSuspend() {
        if (this.selectedUsers.size === 0) return;
        this.openConfirmModal(
            'Suspender Usuarios',
            `¿Estás seguro de que deseas suspender a los ${this.selectedUsers.size} usuarios seleccionados?`,
            () => {
                this.allUsers.forEach(u => {
                    if (this.selectedUsers.has(u.id)) u.status = 'SUSPENDED';
                });
                this.selectedUsers.clear();
                this.applyFilters();
            }
        );
    }

    bulkResetPassword() {
        if (this.selectedUsers.size === 0) return;
        this.openConfirmModal(
            'Restablecer Contraseñas',
            `¿Deseas enviar instrucciones de restablecimiento de contraseña a los ${this.selectedUsers.size} usuarios seleccionados?`,
            () => {
                // Mock API call
                this.selectedUsers.clear();
                // Show success toast or small notification instead of alert if possible, otherwise rely on the modal closing as feedback
            }
        );
    }

    getPagesArray(): number[] {
        return Array(this.totalPages).fill(0).map((x, i) => i + 1);
    }

    getRoleLabel(role: string): string {
        const roleMap: Record<string, string> = {
            'ADMIN': 'Administrador',
            'TEACHER': 'Docente',
            'STUDENT': 'Estudiante',
            'USER': 'Usuario'
        };
        return roleMap[role] || role;
    }
}
