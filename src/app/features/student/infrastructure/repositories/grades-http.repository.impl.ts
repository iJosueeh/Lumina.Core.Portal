import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, tap, catchError, switchMap } from 'rxjs';
import { GradesRepository } from '../../domain/repositories/grades.repository';
import { CourseGrade, GradeStats, Evaluation } from '../../domain/models/grade.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '@core/services/cache.service';

/**
 * Backend EvaluacionResponse shape from GetEvaluacionesByEstudiante:
 * {
 *   id, titulo, cursoId, cursoNombre, fechaInicio, fechaFin, fechaLimite,
 *   duracionMinutos, duracion, estado, tipoEvaluacion, intentos, intentosMaximos,
 *   totalPreguntas, puntajeMaximo
 * }
 *
 * Backend PromedioEstudianteResponse shape:
 * {
 *   estudianteId, promedioGeneral, totalEvaluaciones,
 *   evaluacionesCompletadas, notaMasAlta, notaMasBaja
 * }
 */

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
    tipoEvaluacion: string;
    intentos: number;
    intentosMaximos: number;
    totalPreguntas: number;
    puntajeMaximo: number;
    nota?: number | null;    // Calificacion real (escala 1-20), null si no ha calificado
    estadoNota?: string | null; // "Completado", "Vencido", "Pendiente"
}

interface PromedioEstudianteResponse {
    estudianteId: string;
    promedioGeneral: number;
    totalEvaluaciones: number;
    evaluacionesCompletadas: number;
    notaMasAlta: number | null;
    notaMasBaja: number | null;
}

interface CursoResponse {
    id: string;
    titulo: string; // API uses 'titulo' not 'nombre'
    codigo: string;
    creditos: number;
    instructor?: {
        nombre: string;
        cargo?: string;
    };
    ciclo?: string;
}

@Injectable({ providedIn: 'root' })
export class GradesHttpRepositoryImpl extends GradesRepository {
    private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;
    private readonly cursosApiUrl = environment.cursosApiUrl;
    private readonly CACHE_TTL = 5 * 60 * 1000;

    constructor(
        private http: HttpClient,
        private cacheService: CacheService,
    ) {
        super();
    }

    override getGradesByStudent(studentId: string): Observable<CourseGrade[]> {
        const cacheKey = `grades-${studentId}`;
        const cachedData = this.cacheService.get<CourseGrade[]>(cacheKey);
        if (cachedData) {
            return of(cachedData);
        }

        return forkJoin({
            evaluacionesResp: this.http
                .get<{ evaluaciones: EvaluacionResponse[] } | EvaluacionResponse[]>(
                    `${this.evaluacionesApiUrl}/evaluaciones?estudianteId=${studentId}`
                )
                .pipe(
                    map((response) => {
                        if (Array.isArray(response)) return response;
                        if (response && 'evaluaciones' in response) return (response as any).evaluaciones;
                        return [];
                    }),
                    catchError(() => of([] as EvaluacionResponse[]))
                ),
            enrolledResp: this.http
                .get<any>(`${environment.estudiantesApiUrl}/estudiantes/${studentId}/cursos-matriculados`)
                .pipe(
                    map((response) => response?.value || response || []),
                    catchError(() => of([]))
                ),
        }).pipe(
            switchMap(({ evaluacionesResp, enrolledResp }) => {
                const cursoMap = new Map<string, EvaluacionResponse[]>();
                evaluacionesResp.forEach((ev: EvaluacionResponse) => {
                    if (!cursoMap.has(ev.cursoId)) {
                        cursoMap.set(ev.cursoId, []);
                    }
                    cursoMap.get(ev.cursoId)!.push(ev);
                });

                const enrolledIds = (Array.isArray(enrolledResp) ? enrolledResp : []).map(
                    (c: any) => c.id?.value || c.id || c.Id || c.courseId
                ).filter(Boolean);

                const allCursoIdsSet = new Set<string>([...cursoMap.keys(), ...enrolledIds]);
                const cursoIds = Array.from(allCursoIdsSet);

                if (cursoIds.length === 0) {
                    return of([] as CourseGrade[]);
                }

                const cursoDetailRequests = cursoIds.map((id) =>
                    this.http.get<CursoResponse>(`${this.cursosApiUrl}/cursos/${id}`).pipe(
                        catchError(() =>
                            of({
                                id,
                                titulo: `Curso ${id.substring(0, 8).toUpperCase()}`,
                                codigo: id.substring(0, 8).toUpperCase(),
                                creditos: 4,
                            } as CursoResponse)
                        )
                    )
                );
                const cursoPromedioRequests = cursoIds.map((cursoId) =>
                    this.http.get<{ promedio: number }>(
                        `${this.evaluacionesApiUrl}/evaluaciones/estudiante/${studentId}/curso/${cursoId}/promedio`
                    ).pipe(
                        map((r) => ({ cursoId, promedio: r.promedio ?? 0 })),
                        catchError(() => of({ cursoId, promedio: 0 }))
                    )
                );

                return forkJoin({
                    cursos: forkJoin(cursoDetailRequests),
                    promedios: forkJoin(cursoPromedioRequests),
                }).pipe(
                    map(({ cursos, promedios }) => {
                        const cursoDetails = new Map<string, CursoResponse>();
                        cursos.forEach((c) => cursoDetails.set(c.id, c));
                        const promedioMap = new Map<string, number>();
                        promedios.forEach((p) => promedioMap.set(p.cursoId, p.promedio));

                        return cursoIds.map((cursoId): CourseGrade => {
                            const evs = cursoMap.get(cursoId) || [];
                            const cursoDetail = cursoDetails.get(cursoId);

                            const totalEvaluaciones = evs.length;
                            const evsCompletadas = evs.filter(
                                (e) => e.estado === 'Vencido' || e.intentos > 0 || (e.nota && e.nota > 0)
                            );

                            const avance =
                                totalEvaluaciones > 0
                                    ? Math.round(
                                          (evsCompletadas.length / totalEvaluaciones) * 100
                                      )
                                    : 0;

                            const evaluacionesMapped: Evaluation[] = evs.map((e) => ({
                                actividad: e.titulo,
                                peso: e.puntajeMaximo,
                                nota: e.nota ?? 0,
                                estado: (e.estadoNota as 'Completado' | 'Pendiente') ?? (e.intentos > 0 ? 'Completado' : 'Pendiente'),
                            }));

                            const promedio = promedioMap.get(cursoId) ?? 0;

                            const totalEvs = evaluacionesMapped.length;
                            const completedEvs = evaluacionesMapped.filter(e => e.estado === 'Completado').length;
                            const isCourseConcluded = totalEvs > 0 && completedEvs >= totalEvs;

                            let estado: 'Aprobado' | 'En Curso' | 'En Riesgo' | 'Desaprobado' = 'En Curso';
                            if (isCourseConcluded) {
                                estado = promedio >= 12 ? 'Aprobado' : 'Desaprobado';
                            } else {
                                // El curso sigue en progreso al faltar evaluaciones
                                if (promedio > 0 && promedio < 12) {
                                    estado = 'En Riesgo';
                                } else {
                                    estado = 'En Curso';
                                }
                            }

                            return {
                                id: cursoId,
                                nombre: cursoDetail?.titulo ?? `Curso ${cursoId.substring(0, 8).toUpperCase()}`,
                                codigo: cursoDetail?.codigo ?? cursoId.substring(0, 8).toUpperCase(),
                                profesor: cursoDetail?.instructor?.nombre ?? 'Docente Asignado',
                                creditos: cursoDetail?.creditos ?? 4,
                                avance,
                                promedio,
                                estado,
                                evaluaciones: evaluacionesMapped,
                                promedioClase: 0,
                                posicionamiento: 0,
                                totalEstudiantes: 0,
                                isExpanded: false,
                            };
                        });
                    })
                );
            }),
            tap((grades) => {
                this.cacheService.set(cacheKey, grades, this.CACHE_TTL);
            }),
            catchError((error) => {
                console.error('[GRADES] Error loading grades:', error);
                return of([] as CourseGrade[]);
            })
        );
    }

    override getGradeStats(studentId: string): Observable<GradeStats> {
        // Use the real promedio endpoint — no caching, data must be fresh
        return this.http
            .get<PromedioEstudianteResponse>(
                `${this.evaluacionesApiUrl}/evaluaciones/estudiante/${studentId}/promedio`,
                { headers: { 'Cache-Control': 'no-cache' } }
            )
            .pipe(
                map((response) => {
                    const promedio = Number(response.promedioGeneral) || 0;
                    return {
                        promedioGeneral: promedio,
                        creditosAprobados: response.evaluacionesCompletadas * 4,
                        totalCreditos: response.totalEvaluaciones * 4,
                        cursosCompletados: response.evaluacionesCompletadas,
                        // Ranking show actual grade, not percentile without class data
                        rankingClase: promedio > 0 ? `${promedio.toFixed(1)}/20` : 'Sin datos',
                        percentilRanking: 0,
                        ultimaActualizacion: new Date(),
                    };
                }),
                catchError((error) => {
                    console.error('[GRADES] Error loading stats:', error);
                    return of({
                        promedioGeneral: 0,
                        creditosAprobados: 0,
                        totalCreditos: 0,
                        cursosCompletados: 0,
                        rankingClase: 'Sin datos',
                        percentilRanking: 0,
                        ultimaActualizacion: new Date(),
                    });
                })
            );
    }
}
