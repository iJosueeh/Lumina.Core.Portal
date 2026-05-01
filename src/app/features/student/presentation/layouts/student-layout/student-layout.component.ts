import { Component, inject, signal, computed } from '@angular/core';
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
    styles: ``
})
export class StudentLayoutComponent {
    private authRepository = inject(AuthRepository);
    private router = inject(Router);

    isSidebarOpen = signal(false);
    
    currentUser = computed(() => this.authRepository.getCurrentUser());
    userName = computed(() => this.currentUser()?.fullName || 'Estudiante');
    userAvatar = computed(() => 'https://ui-avatars.com/api/?name=' + this.userName() + '&background=0ea5e9&color=fff');

    menuItems: MenuItem[] = [
        { icon: 'th-large', label: 'Dashboard', route: '/student/dashboard' },
        { icon: 'book', label: 'Mis Cursos', route: '/student/my-courses' },
        { icon: 'calendar-alt', label: 'Horario', route: '/student/schedule' },
        { icon: 'chart-bar', label: 'Calificaciones', route: '/student/grades' },
        { icon: 'file-alt', label: 'Evaluaciones', route: '/student/evaluations' },
        { icon: 'folder-open', label: 'Recursos', route: '/student/resources' }
    ];

    logout(): void {
        this.authRepository.logout();
        this.router.navigate(['/login']);
    }

    toggleSidebar(): void {
        this.isSidebarOpen.update(v => !v);
    }

    closeSidebar(): void {
        this.isSidebarOpen.set(false);
    }
}
