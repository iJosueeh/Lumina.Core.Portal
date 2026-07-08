import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';
import { User } from '@features/auth/domain/models/user.model';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth.service';
import { CacheService } from '@core/services/cache.service';

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
    private readonly API_URL = `${environment.apiUrl}/auth`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private cacheService: CacheService
    ) {
        super();
    }

    override login(credentials: LoginCredentials): Observable<User> {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, {
            email: credentials.username,
            password: credentials.password
        }).pipe(
            map(response => {
                if (!response?.token || !response?.userInfo) {
                    throw new Error('Respuesta del servidor inválida');
                }
                
                const user: User = {
                    id: response.userInfo.id,
                    email: response.userInfo.email,
                    fullName: `${response.userInfo.nombre} ${response.userInfo.apellido}`,
                    role: this.authService.mapBackendRole(response.userInfo.rolPrincipal),
                    token: response.token
                };
                
                return user;
            }),
            tap(user => {
                this.authService.setSession(user);
                this.cacheService.clear();
            }),
            catchError((error: HttpErrorResponse) => {
                this.authService.logout();
                return throwError(() => error);
            })
        );
    }

    override logout(): void {
        this.authService.logout();
        this.cacheService.clear();
    }

    override getCurrentUser(): User | null {
        return this.authService.getCurrentUser() as User | null;
    }
}
