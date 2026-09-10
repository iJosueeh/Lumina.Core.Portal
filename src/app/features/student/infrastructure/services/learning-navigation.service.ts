import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { ProgressStorageService, LastActiveSession } from './progress-storage.service';

@Injectable({
  providedIn: 'root'
})
export class LearningNavigationService {
  private router = inject(Router);
  private progressStorage = inject(ProgressStorageService);

  /**
   * Navega inteligentemente al mejor punto de aprendizaje del alumno
   */
  resumeLearning(courses: CourseProgress[], studentId?: string): void {
    if (!courses || courses.length === 0) {
      // 1. Si no tiene cursos, ir al catálogo de cursos
      this.router.navigate(['/student/catalog']);
      return;
    }

    // 2. Comprobar si existe una última sesión activa guardada
    const lastSession = this.progressStorage.getLastActiveSession(studentId);
    if (lastSession && courses.some(c => c.id === lastSession.courseId)) {
      this.router.navigate(['/student/course', lastSession.courseId, 'learn', lastSession.lessonId], {
        queryParams: lastSession.moduleId ? { moduleId: lastSession.moduleId } : undefined
      });
      return;
    }

    // 3. Tomar el curso activo prioritario (menor a 100% de progreso o primero)
    const activeCourse = courses.find(c => c.progreso < 100) || courses[0];
    const courseLastLesson = this.progressStorage.getLastLessonForCourse(activeCourse.id, studentId);

    if (courseLastLesson) {
      this.router.navigate(['/student/course', activeCourse.id, 'learn', courseLastLesson]);
    } else {
      // 4. Ir a la vista detallada del curso
      this.router.navigate(['/student/course', activeCourse.id]);
    }
  }

  /**
   * Continúa el aprendizaje de un curso específico directo a su lección pendiente o al aula
   */
  continueCourse(courseId: string, studentId?: string): void {
    const lastLesson = this.progressStorage.getLastLessonForCourse(courseId, studentId);
    if (lastLesson) {
      this.router.navigate(['/student/course', courseId, 'learn', lastLesson]);
    } else {
      this.router.navigate(['/student/course', courseId]);
    }
  }

  /**
   * Obtiene la última sesión activa del estudiante si existe
   */
  getLastSession(studentId?: string): LastActiveSession | null {
    return this.progressStorage.getLastActiveSession(studentId);
  }
}
