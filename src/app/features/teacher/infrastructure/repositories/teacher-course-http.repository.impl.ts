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
                    switchMap(cursos => {
                        if (!cursos || cursos.length === 0) return of([]);
                        const enriched$ = cursos.map(curso => {
                            const courseId = curso.id || curso.cursoId;
                            const enrolled$ = this.http.get<any[]>(`${this.estudiantesApiUrl}/estudiantes/por-curso/${courseId}`).pipe(
                                map(students => students ?? []),
                                catchError(() => of([]))
                            );
                            return enrolled$.pipe(
                                switchMap(students => {
                                    if (students.length === 0) {
                                        return of(this.mapToTeacherCourse(curso, { totalAlumnos: 0, alumnosActivos: 0 }, 0));
                                    }
                                    // Parallel: all students' averages at once
                                    const avgCalls$ = students.map(s =>
                                        this.http.get<any>(`${this.evaluacionesApiUrl}/evaluaciones/estudiante/${s.estudianteId}/promedio`).pipe(
                                            map(r => r?.promedioGeneral ?? null),
                                            catchError(() => of(null))
                                        )
                                    );
                                    return forkJoin(avgCalls$).pipe(
                                        map(notas => {
                                            const validNotas = notas.filter((n): n is number => n !== null && n > 0);
                                            const avgGrade = validNotas.length > 0
                                                ? Math.round(validNotas.reduce((a, b) => a + b, 0) / validNotas.length * 10) / 10
                                                : 0;
                                            return this.mapToTeacherCourse(curso, {
                                                totalAlumnos: students.length,
                                                alumnosActivos: students.length
                                            }, avgGrade);
                                        })
                                    );
                                })
                            );
                        });
                        return forkJoin(enriched$);
                    }),
                    catchError(error => {

                        return of([]);
                    })
                );
            }),
            catchError(error => {

                return of([]);
            })
        );
    }

    override getCourseById(courseId: string): Observable<TeacherCourse> {
        return this.http.get<any>(`${this.cursosApiUrl}/cursos/${courseId}`).pipe(
            switchMap(curso => this.enrichCourseWithStats(curso)),
            catchError(() => of({} as TeacherCourse))
        );
    }

    override getCourseStats(courseId: string): Observable<CourseStats> {
        return this.http.get<any[]>(`${this.estudiantesApiUrl}/estudiantes/por-curso/${courseId}`).pipe(
            switchMap(students => {
                students = students ?? [];
                if (students.length === 0) {
                    return of(this.emptyCourseStats());
                }
                const avgCalls$ = students.map(s =>
                    this.http.get<any>(`${this.evaluacionesApiUrl}/evaluaciones/estudiante/${s.estudianteId}/promedio`).pipe(
                        map(r => r?.promedioGeneral ?? null),
                        catchError(() => of(null))
                    )
                );
                return forkJoin(avgCalls$).pipe(
                    map(notas => {
                        const validNotas = notas.filter((n): n is number => n !== null && n > 0);
                        const avgGrade = validNotas.length > 0
                            ? Math.round(validNotas.reduce((a, b) => a + b, 0) / validNotas.length * 10) / 10
                            : 0;
                        return {
                            totalAlumnos: students.length,
                            alumnosActivos: students.length,
                            alumnosInactivos: 0,
                            promedioGeneral: avgGrade,
                            aprobados: 0, reprobados: 0,
                            asistenciaPromedio: 0,
                            tareasEntregadas: 0, tareasPendientes: 0
                        } as CourseStats;
                    })
                );
            }),
            catchError(() => of(this.emptyCourseStats()))
        );
    }

    override updateCourse(courseId: string, course: Partial<TeacherCourse>): Observable<TeacherCourse> {
        return this.http.put<any>(`${this.cursosApiUrl}/cursos/${courseId}`, course).pipe(
            map(response => this.mapToTeacherCourse(response))
        );
    }

    private enrichCourseWithStats(curso: any): Observable<TeacherCourse> {
        const courseId = curso.id || curso.cursoId;
        return this.http.get<any[]>(`${this.estudiantesApiUrl}/estudiantes/por-curso/${courseId}`).pipe(
            switchMap(students => {
                students = students ?? [];
                if (students.length === 0) {
                    return of(this.mapToTeacherCourse(curso, { totalAlumnos: 0, alumnosActivos: 0 }, 0));
                }
                const avgCalls$ = students.map(s =>
                    this.http.get<any>(`${this.evaluacionesApiUrl}/evaluaciones/estudiante/${s.estudianteId}/promedio`).pipe(
                        map(r => r?.promedioGeneral ?? null),
                        catchError(() => of(null))
                    )
                );
                return forkJoin(avgCalls$).pipe(
                    map(notas => {
                        const validNotas = notas.filter((n): n is number => n !== null && n > 0);
                        const avgGrade = validNotas.length > 0
                            ? Math.round(validNotas.reduce((a, b) => a + b, 0) / validNotas.length * 10) / 10
                            : 0;
                        return this.mapToTeacherCourse(curso, {
                            totalAlumnos: students.length,
                            alumnosActivos: students.length
                        }, avgGrade);
                    })
                );
            }),
            catchError(() => of(this.mapToTeacherCourse(curso, { totalAlumnos: 0, alumnosActivos: 0 }, 0)))
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
            totalAlumnos: conteo?.totalAlumnos ?? 0,
            alumnosActivos: conteo?.alumnosActivos ?? 0,
            promedioGeneral: promedioGeneral ?? 0,
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
