import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { TeacherInfo } from '../../domain/models/teacher-info.model';
import { TeacherCourse } from '../../domain/models/teacher-course.model';
import { TeacherDashboardStats } from '../../domain/models/teacher-dashboard-stats.model';
import { GetTeacherCoursesUseCase } from '../../application/use-cases/get-teacher-courses.usecase';

/**
 * Servicio que proporciona las funciones de query para TanStack Query
 * Estas funciones retornan Promises en lugar de Observables
 */
@Injectable({
  providedIn: 'root'
})
export class TeacherQueryService {
  private http = inject(HttpClient);
  private getCoursesUseCase = inject(GetTeacherCoursesUseCase);
  private readonly docentesApiUrl = environment.docentesApiUrl;
  private readonly estudiantesApiUrl = environment.estudiantesApiUrl;

  /**
   * Obtiene información del docente por usuario_id
   */
  async getTeacherInfo(teacherId: string): Promise<TeacherInfo> {
    console.log(`🔍 [TEACHER-QUERY] Fetching teacher info for userId: ${teacherId}`);
    
    const response = await firstValueFrom(
      this.http.get<any>(`${this.docentesApiUrl}/docente/by-usuario/${teacherId}`)
    );
    
    return {
      id: response.id.value,
      usuarioId: response.usuarioId,
      especialidadId: response.especialidadId.value,
      nombre: response.nombre,
      cargo: response.cargo,
      bio: response.bio,
      avatar: response.avatar,
      linkedIn: response.linkedIn
    };
  }

  /**
   * Obtiene los cursos del docente
   * Usa el use case existente que maneja la lógica de llamadas HTTP
   */
  async getTeacherCourses(teacherId: string): Promise<TeacherCourse[]> {
    console.log(`🔍 [TEACHER-QUERY] Fetching courses for teacherId: ${teacherId}`);
    
    // Usar el use case que ya tiene la lógica implementada
    return await firstValueFrom(this.getCoursesUseCase.execute(teacherId));
  }

  /**
   * Obtiene las estadísticas del dashboard del docente
   */
  async getDashboardStats(teacherId: string): Promise<TeacherDashboardStats> {
    console.log(`🔍 [TEACHER-QUERY] Fetching dashboard stats for userId: ${teacherId}`);
    
    return await firstValueFrom(
      this.http.get<TeacherDashboardStats>(
        `${this.docentesApiUrl}/docente/by-usuario/${teacherId}/dashboard-stats`
      )
    );
  }

  /**
   * Obtiene el horario del docente (programaciones desde Estudiantes microservice)
   */
  async getTeacherSchedule(teacherId: string): Promise<any> {
    const classes = await firstValueFrom(
      this.http.get<any[]>(`${this.estudiantesApiUrl}/programaciones?docenteId=${teacherId}`)
    );
    return { classes: classes ?? [] };
  }

  /**
   * Obtiene los estudiantes de un curso
   */
  async getCourseStudents(courseId: string): Promise<any[]> {
    return await firstValueFrom(
      this.http.get<any[]>(`${this.estudiantesApiUrl}/estudiantes/por-curso/${courseId}`)
    );
  }
}
