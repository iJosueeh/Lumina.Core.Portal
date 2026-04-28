import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AdminDashboardData, SystemStatus, RecentActivity } from '../mocks';
import { AdminDashboardStatsService } from './admin-dashboard-stats.service';
import { AdminDashboardHealthService } from './admin-dashboard-health.service';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardApiService {
  private http = inject(HttpClient);
  private statsService = inject(AdminDashboardStatsService);
  private healthService = inject(AdminDashboardHealthService);

  getDashboardData(): Observable<AdminDashboardData> {
    return forkJoin({
      estudiantes: this.getEstudiantesCount(),
      docentes: this.getDocentesCount(),
      cursos: this.getCursosCount(),
      usuarios: this.getUsuariosCount(),
      systemStatus: this.getSystemStatus(),
      recentActivity: this.getRecentActivity(),
    }).pipe(
      map(({ estudiantes, docentes, cursos, usuarios, systemStatus, recentActivity }) => ({
        stats: this.statsService.buildStats(estudiantes, docentes, cursos, usuarios),
        systemStatus: systemStatus,
        recentActivity: recentActivity,
        chartData: this.statsService.buildChartData(),
      })),
      catchError((error) => {
        console.error('Error cargando datos del dashboard:', error);
        return of({
          stats: [],
          systemStatus: this.healthService.buildSystemStatusTodo(),
          recentActivity: this.healthService.buildRecentActivityTodo(),
          chartData: undefined,
        });
      })
    );
  }

  private getEstudiantesCount(): Observable<number> {
    return this.http.get<number>(`${environment.estudiantesApiUrl}/estudiantes/system/count`).pipe(
      catchError(() => of(0))
    );
  }

  private getDocentesCount(): Observable<number> {
    return this.http.get<number>(`${environment.docentesApiUrl}/docente/system/count`).pipe(
      catchError(() => of(0))
    );
  }

  private getCursosCount(): Observable<number> {
    return this.http.get<number>(`${environment.cursosApiUrl}/cursos/system/count`).pipe(
      catchError(() => of(0))
    );
  }

  private getUsuariosCount(): Observable<number> {
    return this.http.get<number>(`${environment.usuariosApiUrl}/usuarios/system/count`).pipe(
      catchError(() => of(0))
    );
  }

  private getSystemStatus(): Observable<SystemStatus[]> {
    return forkJoin({
      apiStatus: this.checkApiStatus(),
      dbStatus: this.checkDatabaseStatus(),
      servicesStatus: this.checkServicesStatus(),
    }).pipe(
      map(({ apiStatus, dbStatus, servicesStatus }) => 
        this.healthService.buildSystemStatus(apiStatus, dbStatus, servicesStatus)
      ),
      catchError(() => of(this.healthService.buildSystemStatusTodo()))
    );
  }

  private getRecentActivity(): Observable<RecentActivity[]> {
    return this.http.get<any[]>(`${environment.usuariosApiUrl}/usuarios/system/recent`).pipe(
      map(data => this.healthService.buildRecentActivityFromData(data)),
      catchError(() => of(this.healthService.buildRecentActivityTodo()))
    );
  }

  private checkApiStatus(): Observable<boolean> {
    return this.http.get<any>(`${environment.usuariosApiUrl}/usuarios/system/health`).pipe(
      map(res => res && res.status === 'Healthy'),
      catchError(() => of(false))
    );
  }

  private checkDatabaseStatus(): Observable<boolean> {
    return this.http.get<any>(`${environment.cursosApiUrl}/cursos/system/health`).pipe(
      map(res => res && res.status === 'Healthy'),
      catchError(() => of(false))
    );
  }

  private checkServicesStatus(): Observable<boolean> {
    return this.http.get<any>(`${environment.estudiantesApiUrl}/estudiantes/system/health`).pipe(
      map(res => res && res.status === 'Healthy'),
      catchError(() => of(false))
    );
  }
}
