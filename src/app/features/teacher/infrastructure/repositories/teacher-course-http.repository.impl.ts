import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TeacherCourseRepository } from '../../domain/repositories/teacher-course.repository';
import { TeacherCourse, CourseStats } from '../../domain/models/teacher-course.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TeacherCourseHttpRepositoryImpl extends TeacherCourseRepository {
    private readonly cursosApiUrl = environment.cursosApiUrl;

    constructor(private http: HttpClient) {
        super();
    }

    override getCoursesByTeacher(teacherId: string): Observable<TeacherCourse[]> {
        return this.http.get<any>(`${this.cursosApiUrl}/Cursos?docenteId=${teacherId}`).pipe(
            map(response => {
                console.log('🔍 [TEACHER-COURSES] RAW Response:', response);
                
                let cursos: any[];
                if (Array.isArray(response)) {
                    cursos = response;
                } else if (response && Array.isArray(response.data)) {
                    cursos = response.data;
                } else if (response && Array.isArray(response.cursos)) {
                    cursos = response.cursos;
                } else {
                    console.error('❌ [TEACHER-COURSES] Formato inesperado:', response);
                    cursos = [];
                }

                return cursos.map(curso => this.mapToTeacherCourse(curso));
            })
        );
    }

    override getCourseById(courseId: string): Observable<TeacherCourse> {
        return this.http.get<any>(`${this.cursosApiUrl}/Cursos/${courseId}`).pipe(
            map(response => this.mapToTeacherCourse(response))
        );
    }

    override getCourseStats(courseId: string): Observable<CourseStats> {
        return this.http.get<any>(`${this.cursosApiUrl}/Cursos/${courseId}/estadisticas`).pipe(
            map(response => ({
                totalAlumnos: response.totalAlumnos || 0,
                alumnosActivos: response.alumnosActivos || 0,
                alumnosInactivos: response.alumnosInactivos || 0,
                promedioGeneral: response.promedioGeneral || 0,
                aprobados: response.aprobados || 0,
                reprobados: response.reprobados || 0,
                asistenciaPromedio: response.asistenciaPromedio || 0,
                tareasEntregadas: response.tareasEntregadas || 0,
                tareasPendientes: response.tareasPendientes || 0
            }))
        );
    }

    override updateCourse(courseId: string, course: Partial<TeacherCourse>): Observable<TeacherCourse> {
        return this.http.put<any>(`${this.cursosApiUrl}/Cursos/${courseId}`, course).pipe(
            map(response => this.mapToTeacherCourse(response))
        );
    }

    private mapToTeacherCourse(data: any): TeacherCourse {
        return {
            id: data.id || data.cursoId,
            codigo: data.codigo,
            titulo: data.titulo || data.nombre,
            descripcion: data.descripcion,
            creditos: data.creditos || 0,
            ciclo: data.ciclo || 'N/A',
            totalAlumnos: data.totalAlumnos || 0,
            alumnosActivos: data.alumnosActivos || 0,
            promedioGeneral: data.promedioGeneral || 0,
            asistenciaPromedio: data.asistenciaPromedio || 0,
            estadoCurso: data.estado || 'Activo',
            horario: data.horario || [],
            silabo: data.silabo
        };
    }
}
