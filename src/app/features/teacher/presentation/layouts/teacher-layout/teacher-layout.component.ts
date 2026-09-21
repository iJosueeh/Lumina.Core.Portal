import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { SidebarComponent, SidebarConfig } from '@shared/components/ui/sidebar/sidebar.component';
import { SiteConfigService } from '@core/services/site-config.service';

@Component({
    selector: 'app-teacher-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent],
    template: `
        <div class="min-h-screen bg-gray-50 text-slate-900 font-sans flex overflow-x-clip max-w-[100vw]">
            <app-sidebar 
                #sidebar
                [config]="sidebarConfig"
                (logoutEvent)="handleLogout()">
            </app-sidebar>

            <div class="flex-1 flex flex-col min-w-0 lg:ml-72 overflow-x-clip relative">
                <header class="lg:hidden sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
                    <div class="flex items-center gap-3">
                        <button (click)="sidebar.toggle()" class="w-10 h-10 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors min-w-[44px] min-h-[44px] cursor-pointer" aria-label="Abrir menú">
                            <i class="fas fa-bars text-lg"></i>
                        </button>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm shadow-sm shadow-indigo-200 font-bold">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <span class="font-bold text-slate-900 text-base tracking-tight">{{ siteName() }}</span>
                        </div>
                    </div>
                </header>
                <main class="flex-1 overflow-y-auto">
                    <router-outlet></router-outlet>
                </main>
            </div>
        </div>
    `,
    styles: ``
})
export class TeacherLayoutComponent {
    @ViewChild('sidebar') sidebar!: SidebarComponent;
    private authRepository = inject(AuthRepository);
    private router = inject(Router);
    private siteConfig = inject(SiteConfigService);

    siteName = this.siteConfig.siteName;

    sidebarConfig: SidebarConfig = {
        logoIcon: 'graduation-cap',
        panelTitle: 'Panel del Docente',
        roleLabel: 'Docente',
        menuItems: [
                    { icon: 'th-large', label: 'Dashboard', route: '/teacher/dashboard', category: 'Panel' },
                    { icon: 'book', label: 'Mis Cursos', route: '/teacher/courses', category: 'Gestión' },
                    { icon: 'users', label: 'Alumnos', route: '/teacher/students', category: 'Gestión' },
                    { icon: 'clipboard-check', label: 'Asistencia', route: '/teacher/attendance', category: 'Gestión' },
                    { icon: 'file-alt', label: 'Mis Evaluaciones', route: '/teacher/evaluations', category: 'Académico' },
                    { icon: 'chart-bar', label: 'Calificaciones', route: '/teacher/grades', category: 'Académico' },
                    { icon: 'folder-open', label: 'Materiales', route: '/teacher/materials', category: 'Académico' },
                    { icon: 'calendar-alt', label: 'Horario', route: '/teacher/schedule', category: 'Académico' }
                ]
    };

    handleLogout(): void {
        this.authRepository.logout();
        this.router.navigate(['/login']);
    }
}
