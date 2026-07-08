import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { SidebarComponent, SidebarConfig } from '@shared/components/ui/sidebar/sidebar.component';

@Component({
    selector: 'app-student-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent],
    template: `
        <div class="min-h-screen bg-gray-50 text-slate-900 font-sans">
            <app-sidebar 
                #sidebar
                [config]="sidebarConfig"
                (logoutEvent)="handleLogout()">
            </app-sidebar>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col min-w-0 lg:ml-72">
                <!-- Navbar Móvil -->
                <header class="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-6">
                    <button (click)="sidebar.toggle()" class="p-2 text-slate-600">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="ml-4 font-bold text-slate-900">LUMINA.CORE</div>
                </header>

                <!-- Router Outlet -->
                <main class="flex-1 overflow-y-auto">
                    <router-outlet></router-outlet>
                </main>
            </div>
        </div>
    `,
    styles: ``
})
export class StudentLayoutComponent {
    @ViewChild('sidebar') sidebar!: SidebarComponent;
    private authRepository = inject(AuthRepository);
    private router = inject(Router);

    sidebarConfig: SidebarConfig = {
        logoIcon: 'graduation-cap',
        panelTitle: 'Panel Estudiantil',
        roleLabel: 'Estudiante',
        menuItems: [
            { icon: 'th-large', label: 'Dashboard', route: '/student/dashboard', category: 'Personal' },
            { icon: 'book', label: 'Mis Cursos', route: '/student/courses', category: 'Personal' },
            { icon: 'calendar-alt', label: 'Horario', route: '/student/schedule', category: 'Académico' },
            { icon: 'chart-bar', label: 'Calificaciones', route: '/student/grades', category: 'Académico' },
            { icon: 'file-alt', label: 'Evaluaciones', route: '/student/evaluations', category: 'Recursos' },
            { icon: 'folder-open', label: 'Recursos', route: '/student/resources', category: 'Recursos' }
        ]
    };

    handleLogout(): void {
        this.authRepository.logout();
        this.router.navigate(['/login']);
    }
}
