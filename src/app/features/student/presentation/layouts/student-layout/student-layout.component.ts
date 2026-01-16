import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, RouterOutlet } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './student-layout.component.html',
  styles: ``,
})
export class StudentLayoutComponent implements OnInit {
  userName = 'Alejandro Magno';
  userRole = 'Ingeniería de Software';
  isSidebarOpen = false;

  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/student/dashboard' },
    { icon: 'book', label: 'Mis Cursos', route: '/student/courses' },
    { icon: 'chart', label: 'Calificaciones', route: '/student/grades' },
    { icon: 'calendar', label: 'Horario', route: '/student/schedule' },
    { icon: 'folder', label: 'Recursos', route: '/student/resources' },
    // { icon: 'bell', label: 'Notificaciones', route: '/student/notifications', badge: 3 }
  ];

  constructor(
    private authRepository: AuthRepository,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authRepository.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.fullName;
    }
  }

  logout(): void {
    this.authRepository.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}
