import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { LoginCredentials } from '@features/auth/domain/models/login-credentials.model';
import { User } from '@features/auth/domain/models/user.model';

@Injectable({
    providedIn: 'root'
})
export class LoginUseCase {
    constructor(private authRepository: AuthRepository) { }

    execute(credentials: LoginCredentials): Observable<User> {
        return this.authRepository.login(credentials);
    }
}
