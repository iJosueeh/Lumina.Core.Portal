import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TeacherCourseRepository } from '../../domain/repositories/teacher-course.repository';
import { TeacherCourse, CourseStats } from '../../domain/models/teacher-course.model';

@Injectable({
  providedIn: 'root',
})
export class TeacherCourseMockRepositoryImpl extends TeacherCourseRepository {
  constructor(private http: HttpClient) {
    super();
  }

  override getCoursesByTeacher(teacherId: string): Observable<TeacherCourse[]> {
    console.log('📚 [TEACHER-COURSES-MOCK] Loading courses for teacher:', teacherId);
    
    return this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').pipe(
      map((courses) => {
        console.log('✅ [TEACHER-COURSES-MOCK] Courses loaded:', courses.length);
        return courses.map((course) => this.mapToTeacherCourse(course));
      }),
    );
  }

  override getCourseById(courseId: string): Observable<TeacherCourse> {
    console.log('📚 [TEACHER-COURSES-MOCK] Loading course:', courseId);
    
    return this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').pipe(
      map((courses) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) {
          throw new Error(`Course not found: ${courseId}`);
        }
        console.log('✅ [TEACHER-COURSES-MOCK] Course loaded:', course.titulo);
        return this.mapToTeacherCourse(course);
      }),
    );
  }

  override getCourseStats(courseId: string): Observable<CourseStats> {
    console.log('📊 [TEACHER-COURSES-MOCK] Loading stats for course:', courseId);
    
    return this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').pipe(
      map((courses) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course || !course.stats) {
          throw new Error(`Course stats not found: ${courseId}`);
        }
        console.log('✅ [TEACHER-COURSES-MOCK] Stats loaded');
        return course.stats;
      }),
    );
  }

  override updateCourse(
    courseId: string,
    course: Partial<TeacherCourse>,
  ): Observable<TeacherCourse> {
    console.log('💾 [TEACHER-COURSES-MOCK] Update course (mock):', courseId);
    // En un entorno mock, simplemente retornamos el curso sin cambios
    return this.getCourseById(courseId);
  }

  private mapToTeacherCourse(data: any): TeacherCourse {
    return {
      id: data.id,
      codigo: data.codigo,
      titulo: data.titulo,
      descripcion: data.descripcion,
      creditos: data.creditos || 0,
      ciclo: data.ciclo || 'N/A',
      totalAlumnos: data.totalAlumnos || 0,
      alumnosActivos: data.alumnosActivos || 0,
      promedioGeneral: data.promedioGeneral || 0,
      asistenciaPromedio: data.asistenciaPromedio || 0,
      estadoCurso: data.estadoCurso || 'Activo',
      horario: data.horario || [],
      silabo: data.silabo,
    };
  }
}
