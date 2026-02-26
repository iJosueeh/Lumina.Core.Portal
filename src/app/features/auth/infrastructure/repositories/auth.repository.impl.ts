import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';
import { User } from '@features/auth/domain/models/user.model';
import { environment } from '@environments/environment';
import { CookieService } from '@core/services/cookie.service';

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

    constructor(
        private http: HttpClient,
        private cookieService: CookieService
    ) {
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
                
                // Guardar token en cookie segura
                this.cookieService.set('auth_token', user.token, {
                    expires: 7, // 7 días
                    path: '/',
                    sameSite: 'Lax',
                    secure: false // Cambiar a true en producción con HTTPS
                });
                
                // Guardar usuario en cookie (sin el token)
                const userWithoutToken = { ...user, token: '' };
                this.cookieService.set('current_user', JSON.stringify(userWithoutToken), {
                    expires: 7,
                    path: '/',
                    sameSite: 'Lax'
                });
                
                console.log('💾 [AUTH REPO] Usuario guardado en cookies');
                
                // Limpiar localStorage por seguridad
                localStorage.removeItem('currentUser');
                localStorage.removeItem('token');
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
        
        // Eliminar cookies
        this.cookieService.delete('auth_token');
        this.cookieService.delete('current_user');
        
        // Limpiar localStorage por compatibilidad
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        
        console.log('🗑️ [AUTH REPO] Cookies y localStorage limpiados');
    }

    override getCurrentUser(): User | null {
        if (!this.currentUser) {
            // Intentar recuperar de cookies primero
            const storedInCookie = this.cookieService.get('current_user');
            if (storedInCookie) {
                this.currentUser = JSON.parse(storedInCookie);
                // Recuperar el token de la cookie de auth
                const token = this.cookieService.get('auth_token');
                if (token && this.currentUser) {
                    this.currentUser.token = token;
                }
                console.log('👤 [AUTH REPO] Usuario recuperado de cookies:', this.currentUser?.fullName);
            } else {
                // Fallback a localStorage
                const stored = localStorage.getItem('currentUser');
                if (stored) {
                    this.currentUser = JSON.parse(stored);
                    console.log('👤 [AUTH REPO] Usuario recuperado de localStorage (migrar a cookies):', this.currentUser?.fullName);
                    
                    // Migrar a cookies
                    if (this.currentUser) {
                        const userWithoutToken = { ...this.currentUser, token: '' };
                        this.cookieService.set('current_user', JSON.stringify(userWithoutToken), {
                            expires: 7,
                            path: '/',
                            sameSite: 'Lax'
                        });
                        if (this.currentUser.token) {
                            this.cookieService.set('auth_token', this.currentUser.token, {
                                expires: 7,
                                path: '/',
                                sameSite: 'Lax',
                                secure: false
                            });
                        }
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('token');
                    }
                }
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
