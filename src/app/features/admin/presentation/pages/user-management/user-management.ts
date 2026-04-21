import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService } from '../../../infrastructure/services/admin-user.service';
import { AdminUser } from '@shared/models/admin-user.models';

// Sub-components
import { UserTableComponent } from './components/user-table/user-table.component';
import { UserFormModalComponent } from './components/user-form-modal/user-form-modal.component';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule, UserTableComponent, UserFormModalComponent],
    templateUrl: './user-management.html',
    styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
    private adminService = inject(AdminUserService);

    // State Signals
    allUsers = signal<AdminUser[]>([]);
    isLoading = signal(false);
    searchTerm = signal('');
    selectedRole = signal('Rol: Todos');
    selectedStatus = signal('Estado: Todos');

    // Pagination
    currentPage = signal(1);
    itemsPerPage = 10;

    // Modals State
    isModalOpen = signal(false);
    isEditing = signal(false);
    isSaving = signal(false);
    saveError = signal('');
    currentUser: any = this.getEmptyUser();

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
        if (confirm(`¿Estás seguro de eliminar al usuario ${user.fullName}?`)) {
            // Lógica de eliminación...
        }
    }

    private getEmptyUser(): any {
        return { fullName: '', email: '', role: 'STUDENT', department: '', status: 'ACTIVE' };
    }
}
