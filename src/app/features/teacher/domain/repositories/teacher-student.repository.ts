import { Observable } from 'rxjs';
import { TeacherStudent } from '../models/teacher-student.model';

export abstract class TeacherStudentRepository {
  abstract getStudentsByTeacher(usuarioId: string): Observable<TeacherStudent[]>;
}
