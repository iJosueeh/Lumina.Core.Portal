import { Component, inject, signal, computed, effect, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, catchError, finalize, Observable } from 'rxjs';

// Services
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { CacheService } from '@core/services/cache.service';
import { AdminDashboardApiService } from '../../../infrastructure/services/admin-dashboard-api.service';

// Mocks & Types
import {
  AdminDashboardData,
  ChartData
} from '../../../infrastructure/mocks';

/**
 * Token de inyección para los datos del dashboard
 * Usa el servicio real que conecta a los microservices
 */
export const ADMIN_DASHBOARD_DATA = new InjectionToken<Observable<AdminDashboardData>>(
  'admin-dashboard-data',
  {
    providedIn: 'root',
    factory: () => {
      const apiService = inject(AdminDashboardApiService);
      return apiService.getDashboardData();
    }
  }
);

// Components
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, SkeletonLoaderComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  private authRepository = inject(AuthRepository);
  public router = inject(Router);
  private cacheService = inject(CacheService);
  private dashboardData$ = inject(ADMIN_DASHBOARD_DATA);
  private apiService = inject(AdminDashboardApiService);

  // Signals de Estado
  adminName = signal('Administrador');
  stats = signal<any[]>([]);
  systemStatus = signal<any[]>([]);
  recentActivity = signal<any[]>([]);
  chartData = signal<ChartData | undefined>(undefined);
  chartPeriod = signal<'month' | 'year'>('month');
  isLoading = signal(true);
  isChartLoading = signal(false);
  currentYear = computed(() => new Date().getFullYear().toString());
  hasChartData = computed(() => {
    const d = this.chartData()?.data;
    if (!d || d.length === 0) return false;
    return d.some(p => p.newRegistrations > 0 || p.activeCompletion > 0);
  });

  constructor() {
    effect(() => {
      const user = this.authRepository.getCurrentUser();
      if (user) {
        this.adminName.set(user.fullName.split(' ')[0]);
        this.loadData();
      } else {
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      data: this.dashboardData$.pipe(
        catchError((error) => {
          console.error('❌ [ADMIN_DASHBOARD] Error cargando datos:', error);
          return of({ stats: [], systemStatus: [], recentActivity: [], chartData: undefined });
        })
      ),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ data }) => {
        this.stats.set(data.stats || []);
        this.systemStatus.set(data.systemStatus || []);
        this.recentActivity.set(data.recentActivity || []);
        this.chartData.set(data.chartData || undefined);
      });
  }

  handleRefresh(): void {
    this.cacheService.clear();
    this.loadData();
  }

  switchPeriod(period: 'month' | 'year'): void {
    if (this.chartPeriod() === period) return;
    this.chartPeriod.set(period);
    this.loadChartData();
  }

  private loadChartData(): void {
    this.isChartLoading.set(true);
    this.apiService.getChartData(this.chartPeriod()).pipe(
      catchError(() => of(undefined))
    ).subscribe({
      next: (data) => this.chartData.set(data || undefined),
      complete: () => this.isChartLoading.set(false),
    });
  }

  /**
   * Genera dinámicamente la ruta SVG para un gráfico de datos
   * Usa quadratic Bézier curves para suavizar la línea
   */
  generateCurvePath(data: any[], key: string): string {
    if (!data || data.length === 0) return '';

    const width = 1200;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding;

    // Encontrar valores máximos para normalizar
    const maxValue = Math.max(
      ...data.map(item => Math.max(item.newRegistrations || 0, item.activeCompletion || 0))
    );

    // Calcular puntos
    const points: [number, number][] = data.map((item, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const value = item[key] || 0;
      const normalizedValue = (value / (maxValue || 1));
      const y = height - (normalizedValue * chartHeight) - padding / 2;
      return [x, y];
    });

    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

    // Construir path con quadratic Bézier curves
    let path = `M ${points[0][0]} ${points[0][1]}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = i < points.length - 1 ? points[i + 1] : curr;

      // Control point (promedio de puntos anterior y actual)
      const cp = [(prev[0] + curr[0]) / 2, (prev[1] + curr[1]) / 2];
      
      // Quadratic Bézier
      path += ` Q ${cp[0]} ${cp[1]}, ${curr[0]} ${curr[1]}`;
    }

    return path;
  }
}
