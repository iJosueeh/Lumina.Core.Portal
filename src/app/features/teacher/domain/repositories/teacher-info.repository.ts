import { Observable } from 'rxjs';
import { TeacherInfo } from '../models/teacher-info.model';

export abstract class TeacherInfoRepository {
  abstract getTeacherInfo(teacherId: string): Observable<TeacherInfo>;
}
