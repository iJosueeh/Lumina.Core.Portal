import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TeacherInfoRepository } from '../../domain/repositories/teacher-info.repository';
import { TeacherInfo } from '../../domain/models/teacher-info.model';

@Injectable({
  providedIn: 'root'
})
export class GetTeacherInfoUseCase {
  constructor(private repository: TeacherInfoRepository) {}

  execute(teacherId: string): Observable<TeacherInfo> {
    return this.repository.getTeacherInfo(teacherId);
  }
}
