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
    usuario: {
        id: number;
        email: string;
        nombre: string;
        apellido: string;
        rol: string;
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
                    id: response.usuario.id.toString(),
                    email: response.usuario.email,
                    fullName: `${response.usuario.nombre} ${response.usuario.apellido}`,
                    role: this.mapBackendRole(response.usuario.rol),
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
