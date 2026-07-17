import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of, catchError } from 'rxjs';
import { TeacherCourseRepository } from '../../domain/repositories/teacher-course.repository';
import { TeacherCourse, CourseStats } from '../../domain/models/teacher-course.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TeacherCourseHttpRepositoryImpl extends TeacherCourseRepository {
    private readonly docentesApiUrl = environment.docentesApiUrl;
    private readonly cursosApiUrl = environment.cursosApiUrl;
    private readonly estudiantesApiUrl = environment.estudiantesApiUrl;

    constructor(private http: HttpClient) {
        super();
    }

    override getCoursesByTeacher(usuarioId: string): Observable<TeacherCourse[]> {
        // Step 1: Get docente from usuarioId
        return this.http.get<any>(`${this.docentesApiUrl}/docente/by-usuario/${usuarioId}`).pipe(
            switchMap(docenteResponse => {
                const docenteId = docenteResponse.id?.value || docenteResponse.id;

                // Step 2: Use the instructor endpoint to get only this teacher's courses
                return this.http.get<any[]>(`${this.cursosApiUrl}/cursos/instructor/${docenteId}`).pipe(
                    map(cursos => cursos.map(curso => this.mapToTeacherCourse(curso))),
                    catchError(error => {
                        console.error('Error fetching courses:', error);
                        return of([]);
                    })
                );
            }),
            catchError(error => {
                console.error('Error fetching docente:', error);
                return of([]);
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

    private mapToTeacherCourse(data: any, conteo?: { totalAlumnos: number; alumnosActivos: number }): TeacherCourse {
        return {
            id: data.id || data.cursoId,
            codigo: data.codigo || 'N/A',
            titulo: data.titulo || data.nombre,
            descripcion: data.descripcion,
            creditos: data.creditos || 0,
            ciclo: data.ciclo || 'N/A',
            totalAlumnos: conteo?.totalAlumnos ?? data.totalAlumnos ?? 0,
            alumnosActivos: conteo?.alumnosActivos ?? data.alumnosActivos ?? 0,
            promedioGeneral: data.promedioGeneral || 0,
            asistenciaPromedio: data.asistenciaPromedio || 0,
            estadoCurso: data.estadoCurso || data.estado || 'Activo',
            horario: data.horarios || data.horario || [],
            modulos: data.modulos || [],
            silabo: data.silabo,
            imagen: data.imagen,
            nivel: data.nivel,
            modalidad: data.modalidad,
            duracion: data.duracion,
            categoria: data.categoria,
            instructor: data.instructor
                ? { nombre: data.instructor.nombre, cargo: data.instructor.cargo, avatar: data.instructor.avatar }
                : undefined,
        };
    }
}
