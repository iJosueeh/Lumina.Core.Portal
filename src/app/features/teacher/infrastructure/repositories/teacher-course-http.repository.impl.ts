import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, forkJoin, of, catchError } from 'rxjs';
import { TeacherCourseRepository } from '../../domain/repositories/teacher-course.repository';
import { TeacherCourse, CourseStats } from '../../domain/models/teacher-course.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TeacherCourseHttpRepositoryImpl extends TeacherCourseRepository {
    private readonly docentesApiUrl = environment.docentesApiUrl;
    private readonly cursosApiUrl = environment.cursosApiUrl;

    constructor(private http: HttpClient) {
        super();
    }

    override getCoursesByTeacher(usuarioId: string): Observable<TeacherCourse[]> {
        console.log('🔍 [TEACHER-COURSES-HTTP] Fetching courses for usuarioId:', usuarioId);
        
        // KISS: Obtener docente por usuarioId, luego sus cursos asignados
        return this.http.get<any>(`${this.docentesApiUrl}/docente/by-usuario/${usuarioId}`).pipe(
            switchMap(docenteResponse => {
                const docenteId = docenteResponse.id?.value || docenteResponse.id;
                console.log('✅ [TEACHER-COURSES-HTTP] DocenteId obtenido:', docenteId);
                
                // Obtener cursos impartidos del docente
                return this.http.get<any[]>(`${this.docentesApiUrl}/cursosImpartidos/${docenteId}`).pipe(
                    switchMap(cursosImpartidos => {
                        console.log('📚 [TEACHER-COURSES-HTTP] Cursos impartidos:', cursosImpartidos.length);
                        
                        if (cursosImpartidos.length === 0) {
                            return of([]);
                        }
                        
                        // Por cada curso impartido, obtener detalles del curso
                        // Si un curso no existe, omitirlo en lugar de fallar toda la request
                        const cursoRequests = cursosImpartidos.map(ci => 
                            this.http.get<any>(`${this.cursosApiUrl}/Cursos/${ci.cursoId}`).pipe(
                                map(curso => this.mapToTeacherCourse(curso)),
                                catchError(error => {
                                    console.warn(`⚠️ [TEACHER-COURSES-HTTP] Curso no encontrado: ${ci.cursoId}`, error);
                                    return of(null);
                                })
                            )
                        );
                        
                        return forkJoin(cursoRequests).pipe(
                            map(results => results.filter(curso => curso !== null) as TeacherCourse[])
                        );
                    })
                );
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
