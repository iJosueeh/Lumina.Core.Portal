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
    selector: 'app-teacher-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
    templateUrl: './teacher-layout.component.html',
    styles: ``
})
export class TeacherLayoutComponent implements OnInit {
    userName = 'Docente';
    userRole = 'Profesor';

    menuItems: MenuItem[] = [
        { icon: 'dashboard', label: 'Dashboard', route: '/teacher/dashboard' },
        { icon: 'book', label: 'Mis Cursos', route: '/teacher/courses' },
        { icon: 'users', label: 'Alumnos', route: '/teacher/students' },
        { icon: 'chart', label: 'Calificaciones', route: '/teacher/grades' },
        { icon: 'check', label: 'Asistencia', route: '/teacher/attendance' },
        { icon: 'calendar', label: 'Horario', route: '/teacher/schedule' },
        { icon: 'folder', label: 'Materiales', route: '/teacher/materials' }
    ];

    constructor(
        private authRepository: AuthRepository,
        private router: Router
    ) { }

    ngOnInit(): void {
        const currentUser = this.authRepository.getCurrentUser();
        if (currentUser) {
            this.userName = currentUser.fullName;
            this.userRole = 'Docente';
        }
    }

    logout(): void {
        this.authRepository.logout();
        this.router.navigate(['/login']);
    }
}
