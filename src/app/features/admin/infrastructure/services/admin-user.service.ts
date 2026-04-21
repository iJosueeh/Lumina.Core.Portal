import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AdminUserMapper } from '../mappers/admin-user.mapper';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private http = inject(HttpClient);
  private mapper = inject(AdminUserMapper);
  private readonly apiUrl = environment.apiUrl;

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`).pipe(
      map(users => users.map(u => this.mapper.mapUser(u))),
      catchError(() => this.http.get<any[]>('/assets/mock-data/users/users.json'))
    );
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, userData);
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, userData);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  checkEmailExists(email: string): Observable<boolean> {
    const normalized = (email ?? '').trim().toLowerCase();
    if (!normalized) return of(false);
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`).pipe(
      map(users => users.some(u => (u.email || u.Email || '').toLowerCase() === normalized))
    );
  }
}
