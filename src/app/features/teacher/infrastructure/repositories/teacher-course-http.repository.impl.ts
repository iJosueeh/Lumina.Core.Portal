import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, switchMap, catchError } from 'rxjs';
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
    private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;

    constructor(private http: HttpClient) {
        super();
    }

    override getCoursesByTeacher(usuarioId: string): Observable<TeacherCourse[]> {
        return this.http.get<any>(`${this.docentesApiUrl}/docente/by-usuario/${usuarioId}`).pipe(
            switchMap(docenteResponse => {
                const docenteId = docenteResponse.id?.value || docenteResponse.id;
                return this.http.get<any[]>(`${this.cursosApiUrl}/cursos/instructor/${docenteId}`).pipe(
                    map(cursos => {
                        if (!cursos || cursos.length === 0) return [];
                        return cursos.map(curso => this.mapToTeacherCourse(curso));
                    }),
                    catchError(error => {
                        console.error('❌ [TEACHER-COURSES] Error cargando cursos:', error);
                        return of([]);
                    })
                );
            }),
            catchError(error => {
                console.error('❌ [TEACHER-COURSES] Error resolviendo docente:', error);
                return of([]);
            })
        );
    }

    override getCourseById(courseId: string): Observable<TeacherCourse> {
        return this.http.get<any>(`${this.cursosApiUrl}/cursos/${courseId}`).pipe(
            map(curso => this.mapToTeacherCourse(curso)),
            catchError(() => of({} as TeacherCourse))
        );
    }

    override getCourseStats(courseId: string): Observable<CourseStats> {
        return this.http.get<any>(`${this.estudiantesApiUrl}/estudiantes/cursos/${courseId}/conteo`).pipe(
            map(conteo => {
                const count = typeof conteo === 'number' ? conteo : (conteo?.conteo || conteo?.count || 0);
                return {
                    totalAlumnos: count,
                    alumnosActivos: count,
                    alumnosInactivos: 0,
                    promedioGeneral: 0,
                    aprobados: 0,
                    reprobados: 0,
                    asistenciaPromedio: 0,
                    tareasEntregadas: 0,
                    tareasPendientes: 0
                } as CourseStats;
            }),
            catchError(() => of(this.emptyCourseStats()))
        );
    }

    override updateCourse(courseId: string, course: Partial<TeacherCourse>): Observable<TeacherCourse> {
        return this.http.put<any>(`${this.cursosApiUrl}/cursos/${courseId}`, course).pipe(
            map(response => this.mapToTeacherCourse(response))
        );
    }

    private mapToTeacherCourse(
        data: any,
        conteo?: { totalAlumnos: number; alumnosActivos: number },
        promedioGeneral?: number
    ): TeacherCourse {
        return {
            id: data.id || data.cursoId,
            codigo: data.codigo || 'N/A',
            titulo: data.titulo || data.nombre,
            descripcion: data.descripcion,
            creditos: data.creditos || 0,
            ciclo: data.ciclo || 'N/A',
            totalAlumnos: conteo?.totalAlumnos ?? data.totalAlumnos ?? 0,
            alumnosActivos: conteo?.alumnosActivos ?? data.alumnosActivos ?? 0,
            promedioGeneral: promedioGeneral ?? data.promedioGeneral ?? 0,
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

    private emptyCourseStats(): CourseStats {
        return {
            totalAlumnos: 0, alumnosActivos: 0, alumnosInactivos: 0,
            promedioGeneral: 0, aprobados: 0, reprobados: 0,
            asistenciaPromedio: 0, tareasEntregadas: 0, tareasPendientes: 0
        };
    }
}
