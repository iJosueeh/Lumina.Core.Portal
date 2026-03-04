import { Injectable } from '@angular/core';

interface LessonProgress {
  lessonId: string;
  isCompleted: boolean;
  completedAt?: Date;
}

interface CourseProgress {
  courseId: string;
  studentId: string;
  lessons: LessonProgress[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressStorageService {
  private readonly STORAGE_KEY = 'lumina_course_progress';

  constructor() {}

  /**
   * Guarda el progreso de una lección
   */
  saveLessonProgress(courseId: string, studentId: string, lessonId: string, isCompleted: boolean): void {
    const progress = this.getCourseProgress(courseId, studentId);
    
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
