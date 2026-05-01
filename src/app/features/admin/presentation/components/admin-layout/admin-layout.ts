import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  private router = inject(Router);
  private authRepository = inject(AuthRepository);

  isSidebarOpen = false;
  
  // Datos reales del usuario logueado
  currentUser = this.authRepository.getCurrentUser();
  userName = this.currentUser?.fullName || 'Administrador';
  userRole = this.currentUser?.role || 'Admin';
  
  menuItems = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Cursos', route: '/admin/courses', icon: 'book' },
    { label: 'Docentes', route: '/admin/teachers', icon: 'chalkboard-user' },
    { label: 'Estudiantes', route: '/admin/students', icon: 'user-graduate' },
    { label: 'Configuración', route: '/admin/settings', icon: 'settings' }
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  logout() {
    this.authRepository.logout();
    this.router.navigate(['/login']);
  }
}
