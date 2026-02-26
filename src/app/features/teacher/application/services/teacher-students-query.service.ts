import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TeacherStudent } from '../../domain/models/teacher-student.model';
import { GetTeacherStudentsUseCase } from '../../domain/use-cases/get-teacher-students/get-teacher-students.use-case';

@Injectable({
  providedIn: 'root',
})
export class TeacherStudentsQueryService {
  private getStudentsUseCase = inject(GetTeacherStudentsUseCase);

  async getTeacherStudents(teacherId: string): Promise<TeacherStudent[]> {
    return await firstValueFrom(this.getStudentsUseCase.execute(teacherId));
  }

  async getStudentCount(teacherId: string): Promise<number> {
    const students = await this.getTeacherStudents(teacherId);
    return students.length;
  }
}
