import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
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
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, {
            email: credentials.username,
            password: credentials.password
        }).pipe(
            map(response => {
                if (!response || !response.userInfo) {
                    throw new Error('Respuesta del servidor inválida: no se recibió información del usuario');
                }
                
                const user: User = {
                    id: response.userInfo.id,
                    email: response.userInfo.email,
                    fullName: `${response.userInfo.nombre} ${response.userInfo.apellido}`,
                    role: response.userInfo.rolPrincipal.toUpperCase() as 'STUDENT' | 'TEACHER' | 'ADMIN',
                    token: response.token
                };
                return user;
            }),
            tap(user => {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
            })
        );
    }

    override logout(): void {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    override getCurrentUser(): User | null {
        if (!this.currentUser) {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }
}
