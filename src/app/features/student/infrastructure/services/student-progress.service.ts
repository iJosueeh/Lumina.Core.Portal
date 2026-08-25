// Path: src/app/features/student/infrastructure/services/student-progress.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
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

  getCourseProgress(estudianteId: string, cursoId: string): Observable<StudentCourseProgress> {
    // El estudiante se obtiene del JWT en el backend, no del path
    return this.http.get<any>(
      `${environment.estudiantesApiUrl}/estudiantes/cursos/${cursoId}/aula-video`
    ).pipe(
      tap(response => console.log('[StudentProgressService] Raw response:', JSON.stringify(response)?.slice(0, 500))),
      map(response => {
        // Extraer sections desde la respuesta wrapped { success: true, data: { ... } }
        const payload = response?.data ?? response;
        const sections: any[] = payload?.Sections ?? payload?.sections ?? [];
        console.log('[StudentProgressService] Sections found:', sections.length);

        const completedLessonIds: string[] = [];
        for (const section of sections) {
          for (const video of section.videos || []) {
            if (video.isCompleted) {
              completedLessonIds.push(video.lessonId ?? video.id);
            }
          }
        }

        const totalLessons = sections.reduce((acc: number, s: any) => acc + (s.videos?.length || 0), 0);
        const progressPercent = totalLessons > 0
          ? Math.round((completedLessonIds.length / totalLessons) * 100)
          : 0;

        console.log('[StudentProgressService] Completed lessons:', completedLessonIds.length, completedLessonIds);

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
