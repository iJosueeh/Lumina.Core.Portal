import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { SidebarComponent, SidebarConfig } from '@shared/components/ui/sidebar/sidebar.component';
import { SiteConfigService } from '@core/services/site-config.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="min-h-screen bg-gray-50 text-slate-900 font-sans flex overflow-x-clip max-w-[100vw]">
        <app-sidebar 
            #sidebar
            [config]="sidebarConfig"
            (logoutEvent)="handleLogout()">
        </app-sidebar>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative lg:ml-72">
            <header class="lg:hidden h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
                <div class="flex items-center gap-3">
                  <button 
                    (click)="sidebar.toggle()" 
                    class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer min-w-[44px] min-h-[44px]"
                    aria-label="Abrir menú">
                      <i class="fas fa-bars text-sm"></i>
                  </button>
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                      <i class="fas fa-graduation-cap text-xs"></i>
                    </div>
                    <span class="font-black text-slate-900 text-sm tracking-tight">{{ siteName() }}</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">Admin</span>
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
export class AdminLayout {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  private router = inject(Router);
  private authRepository = inject(AuthRepository);
  private siteConfig = inject(SiteConfigService);

  siteName = this.siteConfig.siteName;

  sidebarConfig: SidebarConfig = {
    logoIcon: 'graduation-cap',
    panelTitle: 'Panel de Administración',
    roleLabel: 'Administrador',
    menuItems: [
      { icon: 'th-large', label: 'Dashboard', route: '/admin/dashboard', category: 'Vision General' },
      { icon: 'book', label: 'Cursos', route: '/admin/courses', category: 'Gestion' },
      { icon: 'users', label: 'Usuarios', route: '/admin/users', category: 'Gestion' },
      { icon: 'newspaper', label: 'Noticias', route: '/admin/noticias', category: 'Contenido' },
      { icon: 'calendar-alt', label: 'Eventos', route: '/admin/eventos', category: 'Contenido' },
      { icon: 'cog', label: 'Configuracion', route: '/admin/settings', category: 'Sistema' }
    ]
  };

  handleLogout(): void {
    this.authRepository.logout();
    this.router.navigate(['/login']);
  }
}
