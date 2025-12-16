import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';
import { User } from '@features/auth/domain/models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthRepositoryImpl extends AuthRepository {

    // Mock users for testing
    private mockUsers: User[] = [
        { id: '1', email: 'estudiante@lumina.edu', fullName: 'Juan Pérez', role: 'STUDENT', token: 'mock-jwt-student' },
        { id: '2', email: 'docente@lumina.edu', fullName: 'Dra. Ana López', role: 'TEACHER', token: 'mock-jwt-teacher' },
        { id: '3', email: 'admin@lumina.edu', fullName: 'Admin General', role: 'ADMIN', token: 'mock-jwt-admin' }
    ];

    private currentUser: User | null = null;

    override login(credentials: LoginCredentials): Observable<User> {
        const user = this.mockUsers.find(u => u.email === credentials.username && u.role === credentials.role);

        // Simulate API delay
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return of(user).pipe(delay(800));
        } else {
            return throwError(() => new Error('Credenciales inválidas'));
        }
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
