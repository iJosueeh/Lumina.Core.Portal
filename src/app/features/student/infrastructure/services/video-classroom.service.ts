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
  private readonly cursosApiUrl = environment.cursosApiUrl;

  constructor(private readonly http: HttpClient) {}

  getCourseVideoClassroom(courseId: string): Observable<VideoClassroomData> {
    // Apuntamos al microservicio de CURSOS para obtener el contenido puro
    return this.http
      .get<any>(
        `${this.cursosApiUrl}/cursos/${courseId}/classroom`
      )
      .pipe(map((response) => {
        // Normalizamos la respuesta si viene envuelta en success/data
        const data = response.data || response;
        return mapVideoClassroomResponse(data);
      }));
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
