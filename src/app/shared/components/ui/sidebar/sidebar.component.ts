import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

export interface MenuItem {
  icon: string;
  label: string;
  route: string;
  category: string;
}

export interface SidebarConfig {
  logoIcon: string;
  panelTitle: string;
  roleLabel: string;
  menuItems: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside 
        class="fixed inset-y-0 left-0 z-50 w-72 h-screen bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col"
        [class.-translate-x-full]="!isOpen()">
        
        <!-- Logo / Brand -->
        <div class="flex items-center gap-3 px-6 pt-6 pb-8 flex-shrink-0">
            <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <i class="fas fa-graduation-cap text-white font-black text-xl"></i>
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-900 tracking-tight">LUMINA<span class="text-indigo-600">.CORE</span></h1>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ config.panelTitle }}</p>
            </div>
        </div>

        <!-- Navegación -->
        <nav class="flex-1 space-y-6 overflow-y-auto custom-scrollbar px-6 min-h-0">
            @for (category of categories(); track category) {
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4">{{ category }}</p>
                    <div class="space-y-1">
                        @for (item of getCategoryItems(category); track item.route) {
                            <a 
                                [routerLink]="item.route" 
                                routerLinkActive="active-link"
                                (click)="close()"
                                class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 hover:text-indigo-600 transition-all text-sm">
                                <i [class]="'fas fa-' + item.icon + ' w-5 text-center text-sm'"></i>
                                <span>{{ item.label }}</span>
                            </a>
                        }
                    </div>
                </div>
            }
        </nav>

        <!-- Perfil del Usuario (Bottom) -->
        <div class="flex-shrink-0 border-t border-slate-100 px-6 py-4 mt-auto">
            <div class="flex items-center gap-3">
                <img [src]="userAvatar()" class="w-9 h-9 rounded-lg border border-slate-200" alt="Avatar">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ userName() }}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ config.roleLabel }}</p>
                </div>
                <button (click)="onLogout()" class="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
                    <i class="fas fa-sign-out-alt text-sm"></i>
                </button>
            </div>
        </div>
    </aside>
  `,
  styles: `
    .active-link {
      background: #eef2ff;
      color: #4f46e5 !important;
      font-weight: 600;
    }
    .active-link i {
      color: #4f46e5;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
  `
})
export class SidebarComponent {
  @Input({ required: true }) config!: SidebarConfig;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  private authRepository = inject(AuthRepository);

  isOpen = signal(false);

  currentUser = computed(() => this.authRepository.getCurrentUser());
  userName = computed(() => this.currentUser()?.fullName || 'Usuario');
  userAvatar = computed(() => 'https://ui-avatars.com/api/?name=' + this.userName() + '&background=4f46e5&color=fff&size=80');

  categories = computed(() => {
    const cats = [...new Set(this.config.menuItems.map(i => i.category))];
    return cats;
  });

  getCategoryItems(category: string): MenuItem[] {
    return this.config.menuItems.filter(i => i.category === category);
  }

  getProfileRoute(): string {
    const role = this.config.roleLabel.toLowerCase();
    if (role.includes('estudiante')) return '/student/account-settings';
    if (role.includes('docente')) return '/teacher/account-settings';
    if (role.includes('admin')) return '/admin/settings';
    return '/';
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
    this.closeSidebar.emit();
  }

  onLogout(): void {
    this.logoutEvent.emit();
  }
}
