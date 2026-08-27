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

    return this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').pipe(
      map((courses) => {

        return courses.map((course) => this.mapToTeacherCourse(course));
      }),
    );
  }

  override getCourseById(courseId: string): Observable<TeacherCourse> {

    return this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').pipe(
      map((courses) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) {
          throw new Error(`Course not found: ${courseId}`);
        }

        return this.mapToTeacherCourse(course);
      }),
    );
  }

  override getCourseStats(courseId: string): Observable<CourseStats> {

    return this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').pipe(
      map((courses) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course || !course.stats) {
          throw new Error(`Course stats not found: ${courseId}`);
        }

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
