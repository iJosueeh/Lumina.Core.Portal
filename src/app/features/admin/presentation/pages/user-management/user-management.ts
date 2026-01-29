import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../infrastructure/services/admin.service';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
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

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.startLoading();
  }

  startLoading() {
      this.isLoading = true;
      this.adminService.getUsers().subscribe(users => {
          this.allUsers = users;
          this.applyFilters();
          this.isLoading = false;
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
      this.currentUser = { fullName: '', email: '', role: 'STUDENT', department: '', status: 'ACTIVE' };
      this.isModalOpen = true;
  }

  openEditUserModal(user: any) {
      this.isEditing = true;
      this.currentUser = { ...user }; // Copy
      this.isModalOpen = true;
  }

  closeModal() {
      this.isModalOpen = false;
  }

  saveUser() {
      if (this.isEditing) {
          this.adminService.updateUser(this.currentUser).subscribe(() => {
              // Update local state mock
              const index = this.allUsers.findIndex(u => u.id === this.currentUser.id);
              if (index !== -1) {
                  this.allUsers[index] = this.currentUser;
                  this.applyFilters();
              }
              this.closeModal();
          });
      } else {
          // Add ID
          this.currentUser.id = `USR-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;
          this.adminService.createUser(this.currentUser).subscribe(() => {
             this.allUsers.unshift(this.currentUser);
             this.applyFilters();
             this.closeModal();
          });
      }
  }

  openDeleteModal(user: any) {
      this.userToDelete = user;
      this.isDeleteModalOpen = true;
  }

  confirmDelete() {
      if (this.userToDelete) {
          this.adminService.deleteUser(this.userToDelete.id).subscribe(() => {
              this.allUsers = this.allUsers.filter(u => u.id !== this.userToDelete.id);
              this.applyFilters();
              this.isDeleteModalOpen = false;
              this.userToDelete = null;
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
}
