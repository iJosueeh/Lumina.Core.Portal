import { Observable } from 'rxjs';
import { StudentProfile, SocialLinks } from '../models/student-profile.model';

export abstract class ProfileRepository {
  abstract getStudentProfile(studentId: string): Observable<StudentProfile>;
  abstract updateProfile(
    studentId: string,
    profile: Partial<StudentProfile>,
  ): Observable<StudentProfile>;
  abstract updateSocialLinks(studentId: string, links: SocialLinks): Observable<SocialLinks>;
  abstract uploadProfilePhoto(studentId: string, file: File): Observable<string>;
}
