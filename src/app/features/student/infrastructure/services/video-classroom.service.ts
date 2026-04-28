import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ApiWrapper,
  VideoClassroomApiResponse,
  VideoClassroomData,
} from './video-classroom.api.model';
import { mapVideoClassroomResponse } from './video-classroom.mapper';

@Injectable({
  providedIn: 'root',
})
export class VideoClassroomService {
  private readonly estudiantesApiUrl = environment.estudiantesApiUrl;

  constructor(private readonly http: HttpClient) {}

  getCourseVideoClassroom(courseId: string): Observable<VideoClassroomData> {
    return this.http
      .get<ApiWrapper<VideoClassroomApiResponse>>(
        `${this.estudiantesApiUrl}/estudiantes/cursos/${courseId}/aula-video`
      )
      .pipe(map((response) => mapVideoClassroomResponse(response.data)));
  }

  updateLessonProgress(
    courseId: string,
    lessonId: string,
    payload: { positionSeconds: number; durationSeconds: number; watchedPercent: number }
  ): Observable<void> {
    return this.http.post<void>(
      `${this.estudiantesApiUrl}/estudiantes/cursos/${courseId}/lessons/${lessonId}/progress`,
      payload
    );
  }

  updateLessonCompletion(
    courseId: string,
    lessonId: string,
    payload: { isCompleted: boolean; source?: string }
  ): Observable<void> {
    return this.http.post<void>(
      `${this.estudiantesApiUrl}/estudiantes/cursos/${courseId}/lessons/${lessonId}/completion`,
      payload
    );
  }
}
