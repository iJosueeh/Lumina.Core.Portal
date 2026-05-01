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
    selector: 'app-teacher-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './teacher-layout.component.html',
    styles: ``
})
export class TeacherLayoutComponent {
    private authRepository = inject(AuthRepository);
    private router = inject(Router);

    isSidebarOpen = signal(false);
    
    currentUser = computed(() => this.authRepository.getCurrentUser());
    userName = computed(() => this.currentUser()?.fullName || 'Docente');
    userAvatar = computed(() => 'https://ui-avatars.com/api/?name=' + this.userName() + '&background=0ea5e9&color=fff');

    menuItems: MenuItem[] = [
        { icon: 'th-large', label: 'Dashboard', route: '/teacher/dashboard' },
        { icon: 'book', label: 'Mis Cursos', route: '/teacher/courses' },
        { icon: 'users', label: 'Alumnos', route: '/teacher/students' },
        { icon: 'file-alt', label: 'Mis Evaluaciones', route: '/teacher/evaluations' },
        { icon: 'chart-bar', label: 'Calificaciones', route: '/teacher/grades' },
        { icon: 'calendar-alt', label: 'Horario', route: '/teacher/schedule' }
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
