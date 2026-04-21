import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AdminDashboardMapper } from '../mappers/admin-dashboard.mapper';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private http = inject(HttpClient);
  private mapper = inject(AdminDashboardMapper);
  private readonly usuariosApiUrl = environment.apiUrl;
  private readonly cursosApiUrl = environment.cursosApiUrl;

  getDashboardData(): Observable<any> {
    return forkJoin({
      usuarios: this.http.get<any[]>(`${this.usuariosApiUrl}/usuarios`).pipe(catchError(() => of([]))),
      cursos: this.http.get<any[]>(`${this.cursosApiUrl}/cursos`).pipe(catchError(() => of([])))
    }).pipe(
      map(({ usuarios, cursos }) => this.mapper.computeStats(usuarios, cursos)),
      catchError(() => of(this.mapper.getFallbackStats()))
    );
  }
}
