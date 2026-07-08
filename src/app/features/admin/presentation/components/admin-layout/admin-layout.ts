import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { SidebarComponent, SidebarConfig } from '@shared/components/ui/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="min-h-screen bg-gray-50 text-slate-900 font-sans flex overflow-hidden">
        <app-sidebar 
            #sidebar
            [config]="sidebarConfig"
            (logoutEvent)="handleLogout()">
        </app-sidebar>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <header class="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-6">
                <button (click)="sidebar.toggle()" class="p-2 text-slate-600">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="ml-4 font-bold text-slate-900">LUMINA.CORE</div>
            </header>
            <main class="flex-1 overflow-y-auto">
                <router-outlet></router-outlet>
            </main>
        </div>
    </div>
  `,
  styles: ``
})
export class AdminLayout {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  private router = inject(Router);
  private authRepository = inject(AuthRepository);

  sidebarConfig: SidebarConfig = {
    logoIcon: 'graduation-cap',
    panelTitle: 'Panel de Administración',
    roleLabel: 'Administrador',
    menuItems: [
      { icon: 'th-large', label: 'Dashboard', route: '/admin/dashboard', category: 'Visión General' },
      { icon: 'book', label: 'Cursos', route: '/admin/courses', category: 'Gestión' },
      { icon: 'users', label: 'Usuarios', route: '/admin/users', category: 'Gestión' },
      { icon: 'cog', label: 'Configuración', route: '/admin/settings', category: 'Sistema' }
    ]
  };

  handleLogout(): void {
    this.authRepository.logout();
    this.router.navigate(['/login']);
  }
}
