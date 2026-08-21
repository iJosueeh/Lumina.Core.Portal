import { Component, Input, Output, EventEmitter, signal, computed, inject, HostListener } from '@angular/core';
import { UserAvatarService } from '@shared/services/user-avatar.service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { SiteConfigService } from '@core/services/site-config.service';

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
    <!-- Overlay (solo mobile) -->
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        (click)="close()"
        @fadeIn>
      </div>
    }

    <!-- Sidebar -->
    <aside
        class="fixed inset-y-0 left-0 z-50 w-72 h-screen bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col"
        [class.-translate-x-full]="!isOpen()"
        style="--sidebar-text-primary: #0f172a; --sidebar-text-secondary: #475569; --sidebar-text-muted: #94a3b8;">

        <!-- Header: Logo + Close Button -->
        <div class="flex items-center justify-between px-6 pt-6 pb-8 flex-shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] rounded-xl flex items-center justify-center shadow-sm">
                  <i class="fas fa-graduation-cap text-white font-black text-xl"></i>
                </div>
                <div>
                  <h1 class="text-xl font-bold tracking-tight" style="color: var(--sidebar-text-primary)">{{ siteName() }}</h1>
                  <p class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--sidebar-text-muted)">{{ config.panelTitle }}</p>
                </div>
            </div>

            <!-- Close button (solo mobile) -->
            <button
                (click)="close()"
                class="lg:hidden p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors"
                style="color: var(--sidebar-text-muted)"
                aria-label="Cerrar menú">
                <i class="fas fa-times text-lg"></i>
            </button>
        </div>

        <!-- Navegación -->
        <nav class="flex-1 space-y-6 overflow-y-auto custom-scrollbar px-6 min-h-0">
            @for (category of categories(); track category) {
                <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest mb-2 px-4" style="color: var(--sidebar-text-muted)">{{ category }}</p>
                    <div class="space-y-1">
                        @for (item of getCategoryItems(category); track item.route) {
                            <a
                                [routerLink]="item.route"
                                routerLinkActive="active-link"
                                (click)="close()"
                                class="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold hover:bg-[var(--sidebar-hover)] transition-all text-sm"
                                style="color: var(--sidebar-text-secondary)">
                                <i [class]="'fas fa-' + item.icon + ' w-5 text-center text-sm'"></i>
                                <span>{{ item.label }}</span>
                            </a>
                        }
                    </div>
                </div>
            }
        </nav>

        <!-- Perfil del Usuario (Bottom) -->
        <div class="flex-shrink-0 border-t border-[var(--sidebar-border)] px-6 py-4 mt-auto">
            <div class="flex items-center gap-3">
                <a [routerLink]="getProfileRoute()" (click)="close()" class="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <img [src]="userAvatar()" class="w-9 h-9 rounded-lg border border-[var(--sidebar-border)]" alt="Avatar">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold truncate" style="color: var(--sidebar-text-primary)">{{ userName() }}</p>
                        <p class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--sidebar-text-muted)">{{ config.roleLabel }}</p>
                    </div>
                </a>
                <button (click)="onLogout()" class="hover:text-[var(--status-error)] transition-colors p-2 rounded-lg hover:bg-[var(--status-error-bg)]" style="color: var(--sidebar-text-muted)">
                    <i class="fas fa-sign-out-alt text-sm"></i>
                </button>
            </div>
        </div>
    </aside>
  `,
  styles: `
    .active-link {
      background: var(--sidebar-active-bg);
      color: var(--sidebar-active-text) !important;
      font-weight: 600;
    }
    .active-link i {
      color: var(--sidebar-active-text);
    }
    .active-link:hover {
      background: var(--sidebar-active-bg) !important;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--sidebar-border);
      border-radius: 10px;
    }
  `
})
export class SidebarComponent {
  @Input({ required: true }) config!: SidebarConfig;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();

  private authRepository = inject(AuthRepository);
  private siteConfig = inject(SiteConfigService);
  private avatarService = inject(UserAvatarService);

  isOpen = signal(false);
  siteName = this.siteConfig.siteName;

  currentUser = computed(() => this.authRepository.getCurrentUser());
  userName = computed(() => this.currentUser()?.fullName || 'Usuario');
  userAvatar = computed(() => {
    const stored = this.avatarService.avatarUrl();
    return stored || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName())}&background=4f46e5&color=fff&size=80`;
  });

  categories = computed(() => {
    const cats = [...new Set(this.config.menuItems.map(i => i.category))];
    return cats;
  });

  getCategoryItems(category: string): MenuItem[] {
    return this.config.menuItems.filter(i => i.category === category);
  }

  getProfileRoute(): string {
    const role = this.config.roleLabel.toLowerCase();
    if (role.includes('estudiante')) return '/student/profile';
    if (role.includes('docente')) return '/teacher/profile';
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

  /** Cerrar sidebar con Escape key */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}
