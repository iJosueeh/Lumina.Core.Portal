import { Injectable } from '@angular/core';

export interface LastActiveSession {
  courseId: string;
  courseTitle?: string;
  lessonId: string;
  lessonTitle?: string;
  moduleId?: string;
  studentId?: string;
  updatedAt: string;
}

interface LessonProgress {
  lessonId: string;
  isCompleted: boolean;
  completedAt?: Date;
}

interface CourseProgress {
  courseId: string;
  studentId: string;
  lastLessonId?: string;
  lessons: LessonProgress[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressStorageService {
  private readonly STORAGE_KEY = 'lumina_course_progress';
  private readonly LAST_SESSION_KEY = 'lumina_last_learning_session';

  constructor() {}

  /**
   * Guarda la última sesión activa de aprendizaje del estudiante
   */
  saveLastActiveSession(session: { courseId: string; courseTitle?: string; lessonId: string; lessonTitle?: string; moduleId?: string; studentId?: string }): void {
    try {
      const payload: LastActiveSession = {
        ...session,
        updatedAt: new Date().toISOString()
      };
      const key = session.studentId ? `${this.LAST_SESSION_KEY}_${session.studentId}` : this.LAST_SESSION_KEY;
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.setItem(this.LAST_SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error guardando última sesión activa:', e);
    }
  }

  /**
   * Obtiene la última sesión activa de aprendizaje
   */
  getLastActiveSession(studentId?: string): LastActiveSession | null {
    try {
      const key = studentId ? `${this.LAST_SESSION_KEY}_${studentId}` : this.LAST_SESSION_KEY;
      const data = localStorage.getItem(key) || localStorage.getItem(this.LAST_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error obteniendo última sesión activa:', e);
      return null;
    }
  }

  /**
   * Obtiene la última lección vista de un curso específico
   */
  getLastLessonForCourse(courseId: string, studentId?: string): string | null {
    if (!studentId) {
      const session = this.getLastActiveSession();
      return session?.courseId === courseId ? session.lessonId : null;
    }
    const progress = this.getCourseProgress(courseId, studentId);
    if (progress.lastLessonId) {
      return progress.lastLessonId;
    }
    const session = this.getLastActiveSession(studentId);
    return session?.courseId === courseId ? session.lessonId : null;
  }

  /**
   * Guarda el progreso de una lección
   */
  saveLessonProgress(courseId: string, studentId: string, lessonId: string, isCompleted: boolean): void {
    const progress = this.getCourseProgress(courseId, studentId);
    progress.lastLessonId = lessonId;
    
    const existingLesson = progress.lessons.find(l => l.lessonId === lessonId);
    
    if (existingLesson) {
      existingLesson.isCompleted = isCompleted;
      existingLesson.completedAt = isCompleted ? new Date() : undefined;
    } else {
      progress.lessons.push({
        lessonId,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined
      });
    }
    
    progress.lastUpdated = new Date();
    this.saveCourseProgress(progress);
    
    console.log(`💾 Progreso guardado: Lección ${lessonId} - ${isCompleted ? 'Completada' : 'Pendiente'}`);
  }

  /**
   * Obtiene el progreso de un curso
   */
  getCourseProgress(courseId: string, studentId: string): CourseProgress {
    const allProgress = this.getAllProgress();
    const key = `${studentId}_${courseId}`;
    
    if (!allProgress[key]) {
      allProgress[key] = {
        courseId,
        studentId,
        lessons: [],
        lastUpdated: new Date()
      };
    }
    
    return allProgress[key];
  }

  /**
   * Verifica si una lección está completada
   */
  isLessonCompleted(courseId: string, studentId: string, lessonId: string): boolean {
    const progress = this.getCourseProgress(courseId, studentId);
    const lesson = progress.lessons.find(l => l.lessonId === lessonId);
    return lesson?.isCompleted ?? false;
  }

  /**
   * Obtiene todas las lecciones completadas de un curso
   */
  getCompletedLessons(courseId: string, studentId: string): string[] {
    const progress = this.getCourseProgress(courseId, studentId);
    return progress.lessons
      .filter(l => l.isCompleted)
      .map(l => l.lessonId);
  }

  /**
   * Calcula el porcentaje de progreso
   */
  calculateProgress(courseId: string, studentId: string, totalLessons: number): number {
    if (totalLessons === 0) return 0;
    
    const completedCount = this.getCompletedLessons(courseId, studentId).length;
    return Math.round((completedCount / totalLessons) * 100);
  }

  /**
   * Limpia el progreso de un curso
   */
  clearCourseProgress(courseId: string, studentId: string): void {
    const allProgress = this.getAllProgress();
    const key = `${studentId}_${courseId}`;
    delete allProgress[key];
    this.saveAllProgress(allProgress);
    console.log(`🗑️ Progreso del curso ${courseId} eliminado`);
  }

  /**
   * Obtiene todo el progreso almacenado
   */
  private getAllProgress(): Record<string, CourseProgress> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error al obtener progreso:', error);
      return {};
    }
  }

  /**
   * Guarda todo el progreso
   */
  private saveAllProgress(progress: Record<string, CourseProgress>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error al guardar progreso:', error);
    }
  }

  /**
   * Guarda el progreso de un curso específico
   */
  private saveCourseProgress(courseProgress: CourseProgress): void {
    const allProgress = this.getAllProgress();
    const key = `${courseProgress.studentId}_${courseProgress.courseId}`;
    allProgress[key] = courseProgress;
    this.saveAllProgress(allProgress);
  }
}
