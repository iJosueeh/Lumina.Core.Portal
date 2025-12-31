import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { GradesRepository } from '../../domain/repositories/grades.repository';
import { CourseGrade, GradeStats, Evaluation } from '../../domain/models/grade.model';
import { environment } from '../../../../../environments/environment';

interface EvaluacionResponse {
    id: string;
    titulo: string;
    cursoId: string;
    cursoNombre: string;
    fechaInicio: string;
    fechaFin: string;
    fechaLimite: string;
    duracionMinutos: number;
    duracion: number;
    estado: string;
    tipo: string;
    intentos: number;
    intentosMaximos: number;
}

interface EntregaResponse {
    id: string;
    evaluacionId: string;
    estudianteId: string;
    fechaEntrega: string;
    archivoUrl?: string;
    calificacion?: number;
    comentarioDocente?: string;
}

interface CursoMatriculadoResponse {
    cursoId: string;
    titulo: string;
    codigo: string;
    creditos: number;
    profesor?: string;
}

@Injectable({
    providedIn: 'root'
})
export class GradesHttpRepositoryImpl extends GradesRepository {
    private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;
    private readonly estudiantesApiUrl = environment.estudiantesApiUrl;
    private readonly cursosApiUrl = environment.cursosApiUrl;

    constructor(private http: HttpClient) {
        super();
    }

    override getGradesByStudent(studentId: string): Observable<CourseGrade[]> {
        // 1. Obtener evaluaciones del estudiante
        return this.http.get<any>(
            `${this.evaluacionesApiUrl}/Evaluaciones?estudianteId=${studentId}`
        ).pipe(
            map(response => {
                console.log('🔍 [GRADES] RAW Response del backend:', response);
                console.log('🔍 [GRADES] Tipo de response:', typeof response);
                console.log('🔍 [GRADES] Es array?:', Array.isArray(response));
                console.log('🔍 [GRADES] Keys:', response ? Object.keys(response) : 'N/A');
                
                // Extraer el array de evaluaciones
                let evaluaciones: EvaluacionResponse[];
                
                if (Array.isArray(response)) {
                    evaluaciones = response;
                } else if (response && Array.isArray(response.data)) {
                    evaluaciones = response.data;
                } else if (response && Array.isArray(response.evaluaciones)) {
                    evaluaciones = response.evaluaciones;
                } else if (response && Array.isArray(response.items)) {
                    evaluaciones = response.items;
                } else {
                    console.error('❌ [GRADES] No se pudo encontrar el array de evaluaciones en:', response);
                    evaluaciones = [];
                }
                
                console.log('✅ [GRADES] Evaluaciones extraídas:', evaluaciones.length, 'items');
                
                // 2. Agrupar evaluaciones por curso
                const cursoMap = new Map<string, EvaluacionResponse[]>();
                
                evaluaciones.forEach(ev => {
                    if (!cursoMap.has(ev.cursoId)) {
                        cursoMap.set(ev.cursoId, []);
                    }
                    cursoMap.get(ev.cursoId)!.push(ev);
                });

                // 3. Convertir a CourseGrade[]
                const courseGrades: CourseGrade[] = [];
                
                cursoMap.forEach((evaluacionesCurso, cursoId) => {
                    const firstEval = evaluacionesCurso[0];
                    
                    // Mapear evaluaciones a Evaluation[]
                    const evaluaciones: Evaluation[] = evaluacionesCurso.map(ev => ({
                        actividad: ev.titulo,
                        peso: 0, // TODO: Obtener del backend si está disponible
                        nota: 0, // TODO: Obtener de Entregas
                        estado: ev.estado === 'Pendiente' ? 'Pendiente' : 'Completado'
                    }));

                    // Calcular promedio (temporal)
                    const evaluacionesCompletadas = evaluaciones.filter(e => e.estado === 'Completado');
                    const promedio = evaluacionesCompletadas.length > 0
                        ? evaluacionesCompletadas.reduce((sum, e) => sum + e.nota, 0) / evaluacionesCompletadas.length
                        : 0;

                    // Calcular avance
                    const avance = evaluaciones.length > 0
                        ? (evaluacionesCompletadas.length / evaluaciones.length) * 100
                        : 0;

                    // Determinar estado del curso
                    let estado: 'Aprobado' | 'En Curso' | 'En Riesgo';
                    if (avance === 100) {
                        estado = promedio >= 11 ? 'Aprobado' : 'En Riesgo';
                    } else {
                        estado = promedio >= 14 ? 'En Curso' : 'En Riesgo';
                    }

                    courseGrades.push({
                        id: cursoId,
                        nombre: firstEval.cursoNombre,
                        codigo: `Código: ${cursoId.substring(0, 8)}`,
                        profesor: 'Prof. Por definir', // TODO: Obtener del backend
                        creditos: 4, // TODO: Obtener del backend
                        avance: Math.round(avance),
                        promedio: Math.round(promedio * 10) / 10,
                        estado,
                        evaluaciones,
                        promedioClase: 15.0, // TODO: Calcular del backend
                        posicionamiento: 0, // TODO: Obtener del backend
                        totalEstudiantes: 0, // TODO: Obtener del backend
                        isExpanded: false
                    });
                });

                return courseGrades;
            })
        );
    }

    override getGradeStats(studentId: string): Observable<GradeStats> {
        // TODO: Implementar cálculo de estadísticas desde el backend
        return of({
            promedioGeneral: 16.5,
            creditosAprobados: 145,
            totalCreditos: 200,
            cursosCompletados: 32,
            rankingClase: 'Top 15%',
            percentilRanking: 15,
            ultimaActualizacion: new Date()
        });
    }
}
