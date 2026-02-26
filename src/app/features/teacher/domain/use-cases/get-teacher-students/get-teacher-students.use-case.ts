import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TeacherStudent } from '../../models/teacher-student.model';
import { TeacherStudentRepository } from '../../repositories/teacher-student.repository';

@Injectable({
  providedIn: 'root',
})
export class GetTeacherStudentsUseCase {
  private repository = inject(TeacherStudentRepository);

  execute(teacherId: string): Observable<TeacherStudent[]> {
    return this.repository.getStudentsByTeacher(teacherId);
  }
}
