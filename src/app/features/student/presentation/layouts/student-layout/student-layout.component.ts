import { Component, inject, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { SidebarComponent, SidebarConfig } from '@shared/components/ui/sidebar/sidebar.component';
import { SiteConfigService } from '@core/services/site-config.service';
import { UserAvatarService } from '@shared/services/user-avatar.service';

@Component({
    selector: 'app-student-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, SidebarComponent],
    template: `
        <div class="min-h-screen bg-gray-50 text-slate-900 font-sans flex flex-col lg:flex-row overflow-x-clip">
            <app-sidebar 
                #sidebar
                [config]="sidebarConfig"
                (logoutEvent)="handleLogout()">
            </app-sidebar>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col min-w-0 lg:ml-72 min-h-screen overflow-x-clip">
                <!-- Navbar Móvil -->
                <header class="lg:hidden h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
                    <div class="flex items-center gap-3">
                        <button (click)="sidebar.toggle()" class="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors" aria-label="Abrir menú">
                            <i class="fas fa-bars text-base"></i>
                        </button>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-xs">
                                <i class="fas fa-graduation-cap text-white text-xs"></i>
                            </div>
                            <span class="font-bold text-slate-900 text-sm sm:text-base tracking-tight">{{ siteName() }}</span>
                        </div>
                    </div>

                    <!-- Right actions: Profile Avatar Shortcut -->
                    <div class="flex items-center gap-2">
                        <a routerLink="/student/profile" class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all" title="Mi Perfil">
                            <img [src]="userAvatar()" class="w-8 h-8 rounded-lg object-cover border border-slate-200" alt="Avatar">
                        </a>
                    </div>
                </header>

                <!-- Router Outlet -->
                <main class="flex-1 overflow-y-auto overflow-x-clip w-full">
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
    private siteConfig = inject(SiteConfigService);
    private avatarService = inject(UserAvatarService);

    siteName = this.siteConfig.siteName;

    currentUser = computed(() => this.authRepository.getCurrentUser());
    userName = computed(() => this.currentUser()?.fullName || 'Estudiante');
    userAvatar = computed(() => {
        const stored = this.avatarService.avatarUrl();
        return stored || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName())}&background=4f46e5&color=fff&size=80`;
    });

    sidebarConfig: SidebarConfig = {
        logoIcon: 'graduation-cap',
        panelTitle: 'Panel Estudiantil',
        roleLabel: 'Estudiante',
        menuItems: [
            { icon: 'th-large', label: 'Dashboard', route: '/student/dashboard', category: 'Personal' },
            { icon: 'book', label: 'Mis Cursos', route: '/student/courses', category: 'Personal' },
            { icon: 'search', label: 'Catálogo de Cursos', route: '/student/catalog', category: 'Personal' },
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
