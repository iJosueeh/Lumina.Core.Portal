import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';
import { User } from '@features/auth/domain/models/user.model';
import { environment } from '@environments/environment';

interface AuthResponse {
    token: string;
    userInfo: {
        id: string;
        email: string;
        nombre: string;
        apellido: string;
        rolPrincipal: string;
    }
}

@Injectable({
    providedIn: 'root'
})
export class AuthRepositoryImpl extends AuthRepository {
    private currentUser: User | null = null;
    private readonly API_URL = `${environment.apiUrl}/auth`;

    constructor(private http: HttpClient) {
        super();
    }

    override login(credentials: LoginCredentials): Observable<User> {
        console.log('🔐 [AUTH REPO] Login attempt:', credentials.username);
        console.log('🎯 [AUTH REPO] API URL:', `${this.API_URL}/login`);
        
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, {
            email: credentials.username,
            password: credentials.password
        }).pipe(
            tap(response => console.log('📥 [AUTH REPO] Respuesta del servidor:', response)),
            map(response => {
                if (!response || !response.token || !response.userInfo) {
                    console.error('❌ [AUTH REPO] Respuesta inválida:', response);
                    throw new Error('Respuesta del servidor inválida');
                }
                
                const mappedRole = this.mapBackendRole(response.userInfo.rolPrincipal);
                console.log('🎭 [AUTH REPO] Rol mapeado:', response.userInfo.rolPrincipal, '->', mappedRole);
                
                const user: User = {
                    id: response.userInfo.id,
                    email: response.userInfo.email,
                    fullName: `${response.userInfo.nombre} ${response.userInfo.apellido}`,
                    role: mappedRole,
                    token: response.token
                };
                
                console.log('✅ [AUTH REPO] Usuario construido:', user);
                return user;
            }),
            tap(user => {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('token', user.token);
                console.log('💾 [AUTH REPO] Usuario guardado en localStorage');
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('🚨 [AUTH REPO] Error en login:', error);
                this.logout();
                return throwError(() => error);
            })
        );
    }

    override logout(): void {
        console.log('🚪 [AUTH REPO] Logout');
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    }

    override getCurrentUser(): User | null {
        if (!this.currentUser) {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                this.currentUser = JSON.parse(stored);
                console.log('👤 [AUTH REPO] Usuario recuperado de localStorage:', this.currentUser?.fullName);
            }
        }
        return this.currentUser;
    }

    private mapBackendRole(backendRole: string): 'STUDENT' | 'TEACHER' | 'ADMIN' {
        const roleMap: Record<string, 'STUDENT' | 'TEACHER' | 'ADMIN'> = {
            'ESTUDIANTE': 'STUDENT',
            'STUDENT': 'STUDENT',
            'PROFESOR': 'TEACHER',
            'TEACHER': 'TEACHER',
            'DOCENTE': 'TEACHER',
            'ADMIN': 'ADMIN',
            'ADMINISTRADOR': 'ADMIN'
        };
        return roleMap[backendRole.toUpperCase()] || 'STUDENT';
    }
}
