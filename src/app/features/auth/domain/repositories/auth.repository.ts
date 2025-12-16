import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { LoginCredentials } from '../models/login-credentials.model';

export abstract class AuthRepository {
    abstract login(credentials: LoginCredentials): Observable<User>;
    abstract logout(): void;
    abstract getCurrentUser(): User | null;
}
