import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { GradesManagementRepository } from '../../domain/repositories/grades-management.repository';
import { StudentGrade, GradeInput, BulkGradeInput } from '../../domain/models/student-grade.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GradesManagementHttpRepositoryImpl extends GradesManagementRepository {
    private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;
    private readonly estudiantesApiUrl = environment.estudiantesApiUrl;

    constructor(private http: HttpClient) {
        super();
    }

    override getGradesByCourse(courseId: string): Observable<StudentGrade[]> {
        // Obtener evaluaciones del curso y estudiantes matriculados
        return this.http.get<any>(`${this.evaluacionesApiUrl}/Evaluaciones?cursoId=${courseId}`).pipe(
            map(response => {
                console.log('🔍 [GRADES-MANAGEMENT] RAW Response:', response);
                
                let evaluaciones: any[];
                if (Array.isArray(response)) {
                    evaluaciones = response;
                } else if (response && Array.isArray(response.data)) {
                    evaluaciones = response.data;
                } else {
                    evaluaciones = [];
                }

                // Agrupar por estudiante
                const studentMap = new Map<string, any[]>();
                evaluaciones.forEach(ev => {
                    if (ev.estudianteId) {
                        if (!studentMap.has(ev.estudianteId)) {
                            studentMap.set(ev.estudianteId, []);
                        }
                        studentMap.get(ev.estudianteId)!.push(ev);
                    }
                });

                const grades: StudentGrade[] = [];
                studentMap.forEach((evals, estudianteId) => {
                    const firstEval = evals[0];
                    grades.push({
                        estudianteId: estudianteId,
                        nombreCompleto: firstEval.estudianteNombre || 'Estudiante',
                        codigo: firstEval.estudianteCodigo || 'N/A',
                        email: firstEval.estudianteEmail || '',
                        cursoId: courseId,
                        evaluaciones: evals.map(ev => ({
                            evaluacionId: ev.id,
                            titulo: ev.titulo,
                            tipo: ev.tipo || 'Examen',
                            peso: ev.peso || 0,
                            calificacion: ev.calificacion,
                            fechaEntrega: ev.fechaEntrega ? new Date(ev.fechaEntrega) : undefined,
                            fechaLimite: new Date(ev.fechaLimite || ev.fechaFin),
                            estado: ev.estado || 'Pendiente',
                            archivoUrl: ev.archivoUrl
                        })),
                        promedioFinal: this.calculateAverage(evals),
                        asistencia: 0,
                        estado: 'En Proceso'
                    });
                });

                return grades;
            })
        );
    }

    override getStudentGrades(courseId: string, studentId: string): Observable<StudentGrade> {
        return this.http.get<any>(
            `${this.evaluacionesApiUrl}/Evaluaciones?cursoId=${courseId}&estudianteId=${studentId}`
        ).pipe(
            map(response => {
                let evaluaciones: any[] = Array.isArray(response) ? response : (response?.data || []);
                
                return {
                    estudianteId: studentId,
                    nombreCompleto: evaluaciones[0]?.estudianteNombre || 'Estudiante',
                    codigo: evaluaciones[0]?.estudianteCodigo || 'N/A',
                    email: evaluaciones[0]?.estudianteEmail || '',
                    cursoId: courseId,
                    evaluaciones: evaluaciones.map(ev => ({
                        evaluacionId: ev.id,
                        titulo: ev.titulo,
                        tipo: ev.tipo || 'Examen',
                        peso: ev.peso || 0,
                        calificacion: ev.calificacion,
                        fechaEntrega: ev.fechaEntrega ? new Date(ev.fechaEntrega) : undefined,
                        fechaLimite: new Date(ev.fechaLimite || ev.fechaFin),
                        estado: ev.estado || 'Pendiente',
                        archivoUrl: ev.archivoUrl
                    })),
                    promedioFinal: this.calculateAverage(evaluaciones),
                    asistencia: 0,
                    estado: 'En Proceso'
                };
            })
        );
    }

    override submitGrade(gradeInput: GradeInput): Observable<void> {
        return this.http.post<void>(
            `${this.evaluacionesApiUrl}/Calificaciones`,
            {
                evaluacionId: gradeInput.evaluacionId,
                estudianteId: gradeInput.estudianteId,
                calificacion: gradeInput.calificacion,
                comentario: gradeInput.comentario
            }
        );
    }

    override submitBulkGrades(bulkInput: BulkGradeInput): Observable<void> {
        return this.http.post<void>(
            `${this.evaluacionesApiUrl}/Calificaciones/bulk`,
            bulkInput
        );
    }

    override updateGrade(gradeId: string, grade: GradeInput): Observable<void> {
        return this.http.put<void>(
            `${this.evaluacionesApiUrl}/Calificaciones/${gradeId}`,
            grade
        );
    }

    private calculateAverage(evaluaciones: any[]): number {
        if (!evaluaciones || evaluaciones.length === 0) return 0;
        
        const calificadas = evaluaciones.filter(ev => ev.calificacion !== null && ev.calificacion !== undefined);
        if (calificadas.length === 0) return 0;
        
        const suma = calificadas.reduce((acc, ev) => acc + (ev.calificacion || 0), 0);
        return suma / calificadas.length;
    }
}
