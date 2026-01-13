import { Observable } from 'rxjs';
import { AccountSettings } from '../models/student-profile.model';

export abstract class AccountRepository {
  abstract changePassword(oldPassword: string, newPassword: string): Observable<boolean>;
  abstract updateSettings(settings: AccountSettings): Observable<AccountSettings>;
  abstract deactivateAccount(reason?: string): Observable<boolean>;
  abstract deleteAccount(password: string): Observable<boolean>;
  abstract exportData(): Observable<Blob>;
}
