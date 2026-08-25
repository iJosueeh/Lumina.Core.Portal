// Path: src/app/features/student/infrastructure/services/student-progress.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';

export interface StudentCourseProgress {
  courseId: string;
  completedLessonIds: string[];
  totalLessons: number;
  progressPercent: number;
}

/** Obtiene el progreso real del estudiante en un curso desde EstudiantesApi */
@Injectable({ providedIn: 'root' })
export class StudentProgressService {
  private http = inject(HttpClient);

  /**
   * Llama a GET /estudiantes/{estudianteId}/cursos/{cursoId}/aula-video
   * que devuelve IsCompleted por cada lección.
   */
  getCourseProgress(estudianteId: string, cursoId: string): Observable<StudentCourseProgress> {
    // El estudiante se obtiene del JWT en el backend, no del path
    return this.http.get<any>(
      `${environment.estudiantesApiUrl}/estudiantes/cursos/${cursoId}/aula-video`
    ).pipe(
      map(response => {
        const sections = response?.data?.Sections || response?.sections || [];
        const completedLessonIds: string[] = [];

        for (const section of sections) {
          for (const video of section.videos || []) {
            if (video.isCompleted) {
              completedLessonIds.push(video.lessonId);
            }
          }
        }

        const totalLessons = completedLessonIds.length > 0
          ? sections.reduce((acc: number, s: any) => acc + (s.videos?.length || 0), 0)
          : 0;

        const progressPercent = totalLessons > 0
          ? Math.round((completedLessonIds.length / totalLessons) * 100)
          : 0;

        return {
          courseId: cursoId,
          completedLessonIds,
          totalLessons,
          progressPercent
        };
      })
    );
  }
}
