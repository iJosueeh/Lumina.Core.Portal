import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';
import { User } from '@features/auth/domain/models/user.model';
import { environment } from '../../../../../environments/environment';
import { CookieService } from '@core/services/cookie.service';
import { CacheService } from '@core/services/cache.service';

interface LoginResponse {
    token: string;
    userInfo: {
        id: string;
        email: string;
        nombre: string;
        apellido: string;
        rolPrincipal: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthHttpRepositoryImpl extends AuthRepository {
    private readonly API_URL = `${environment.apiUrl}/auth`;
    private currentUser: User | null = null;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService,
        private cacheService: CacheService
    ) {
        super();
    }

    override login(credentials: LoginCredentials): Observable<User> {
        return this.http.post<any>(`${this.API_URL}/login`, {
            email: credentials.username,
            password: credentials.password
        }).pipe(
            tap(response => {
                console.log('🔍 RAW Respuesta completa del servidor:', response);
                console.log('🔍 Tipo de respuesta:', typeof response);
                console.log('🔍 Es null?:', response === null);
                console.log('🔍 Es undefined?:', response === undefined);
                console.log('🔍 Keys:', response ? Object.keys(response) : 'N/A');
            }),
            map(response => {
                console.log('📝 Ejecutando map con response:', response);
                console.log('📝 Response es:', JSON.stringify(response, null, 2));
                
                // Validación defensiva completa
                if (!response) {
                    console.error('❌ Response es null o undefined');
                    throw new Error('No se recibió respuesta del servidor');
                }

                if (typeof response !== 'object') {
                    console.error('❌ Response no es un objeto:', typeof response);
                    throw new Error('Respuesta inválida del servidor');
                }

                // Verificar si es una respuesta de error (tiene success: false)
                if (response.success === false) {
                    console.error('❌ El servidor devolvió error:', response);
                    throw new Error(response.message || 'Error en la autenticación');
                }

                // Validar estructura - ser flexible con mayúsculas/minúsculas
                const token = response.token || response.Token;
                const userInfo = response.userInfo || response.UserInfo;

                console.log('🔑 Token extraído:', token ? 'Sí (length: ' + token.length + ')' : 'NO');
                console.log('👤 UserInfo extraído:', userInfo);

                if (!token) {
                    console.error('❌ Response no tiene token:', response);
                    throw new Error('Respuesta sin token de autenticación');
                }

                if (!userInfo) {
                    console.error('❌ Response no tiene userInfo:', response);
                    throw new Error('Respuesta sin información de usuario');
                }

                // El backend retorna AuthUserDto con estos campos
                const userId = userInfo.id || userInfo.Id;
                const userEmail = userInfo.email || userInfo.Email;
                const userNombre = userInfo.nombre || userInfo.Nombre;
                const userApellido = userInfo.apellido || userInfo.Apellido;
                const userRol = userInfo.rolPrincipal || userInfo.RolPrincipal;

                console.log('🆔 userId:', userId);
                console.log('📧 userEmail:', userEmail);
                console.log('👤 userNombre:', userNombre);
                console.log('👤 userApellido:', userApellido);
                console.log('🎭 userRol:', userRol);

                if (!userId) {
                    console.error('❌ userInfo sin id');
                    throw new Error('Usuario sin ID');
                }
                
                if (!userEmail) {
                    console.error('❌ userInfo sin email');
                    throw new Error('Usuario sin email');
                }
                
                if (!userNombre) {
                    console.error('❌ userInfo sin nombre');
                    throw new Error('Usuario sin nombre');
                }
                
                if (!userApellido) {
                    console.error('❌ userInfo sin apellido');
                    throw new Error('Usuario sin apellido');
                }
                
                if (!userRol) {
                    console.error('❌ userInfo sin rol');
                    throw new Error('Usuario sin rol');
                }

                const mappedRole = this.mapBackendRole(userRol);
                console.log('🎭 Rol mapeado de', userRol, 'a', mappedRole);

                const user: User = {
                    id: userId,
                    email: userEmail,
                    fullName: `${userNombre} ${userApellido}`,
                    role: mappedRole,
                    token: token
                };

                console.log('✅ Usuario construido:', user);

                this.currentUser = user;
                
                // Guardar token en cookie segura
                this.cookieService.set('auth_token', token, {
                    expires: 7, // 7 días
                    path: '/',
                    sameSite: 'Lax',
                    secure: false // Cambiar a true en producción con HTTPS
                });
                
                // Guardar usuario en cookie (sin el token por seguridad)
                const userWithoutToken = { ...user, token: '' };
                this.cookieService.set('current_user', JSON.stringify(userWithoutToken), {
                    expires: 7,
                    path: '/',
                    sameSite: 'Lax'
                });

                console.log('💾 Usuario guardado en cookies');
                
                // Limpiar localStorage por seguridad
                localStorage.removeItem('currentUser');
                localStorage.removeItem('token');

                // Limpiar cache de datos de sesión previa
                this.cacheService.clear();
                
                console.log('✅ Usuario mapeado correctamente:', user);
                return user;
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('🚨 Error capturado en catchError:', error);
                console.error('🚨 Status:', error.status);
                console.error('🚨 StatusText:', error.statusText);
                console.error('🚨 Error body:', error.error);
                console.error('🚨 Error message:', error.message);
                
                // Limpiar cualquier dato de sesión previo
                this.logout();
                
                // Relanzar el error con información más clara
                return throwError(() => error);
            })
        );
    }

    override logout(): void {
        this.currentUser = null;
        
        // Eliminar cookies
        this.cookieService.delete('auth_token');
        this.cookieService.delete('current_user');
        
        // Limpiar localStorage por compatibilidad
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');

        // Limpiar cache para evitar datos de usuario previo
        this.cacheService.clear();
        
        console.log('🗑️ [AUTH HTTP REPO] Cookies y localStorage limpiados');
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
                console.log('👤 [AUTH HTTP REPO] Usuario recuperado de cookies');
            } else {
                // Fallback a localStorage
                const stored = localStorage.getItem('currentUser');
                if (stored) {
                    this.currentUser = JSON.parse(stored);
                    console.log('👤 [AUTH HTTP REPO] Usuario recuperado de localStorage (migrar a cookies)');
                    
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
