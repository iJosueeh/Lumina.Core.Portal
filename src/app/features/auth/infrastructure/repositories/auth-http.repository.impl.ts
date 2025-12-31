import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';
import { User } from '@features/auth/domain/models/user.model';
import { environment } from '../../../../../environments/environment';

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

    constructor(private http: HttpClient) {
        super();
    }

    override login(credentials: LoginCredentials): Observable<User> {
        return this.http.post<LoginResponse>(`${this.API_URL}/login`, {
            email: credentials.username,
            password: credentials.password
        }).pipe(
            map(response => {
                const user: User = {
                    id: response.userInfo.id,
                    email: response.userInfo.email,
                    fullName: `${response.userInfo.nombre} ${response.userInfo.apellido}`,
                    role: this.mapBackendRole(response.userInfo.rolPrincipal),
                    token: response.token
                };

                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('token', response.token);

                return user;
            })
        );
    }

    override logout(): void {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
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
