import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap, of, catchError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CourseGradesData, EvaluacionGrades } from '@shared/models/grades-management.models';

interface EvaluacionPayload {
  cursoId: string;
  docenteId: string;
  titulo: string;
  descripcion: string;
  peso: number;
  tipo: number;
  fechaFin: Date;
}

@Injectable({ providedIn: 'root' })
export class TeacherGradesService {
  private http = inject(HttpClient);
  private evalUrl = environment.evaluacionesApiUrl;
  private estudiantesUrl = environment.estudiantesApiUrl;

  /**
   * Carga evaluaciones y calificaciones para un curso.
   * - GET /api/evaluaciones?cursoId={courseId} → lista de evaluaciones
   * - GET /api/evaluaciones/cursos/{courseId}/calificaciones → notas por estudiante
   * - GET /api/estudiantes?cursoId={courseId} → estudiantes del curso
   */
  getCourseGrades(courseId: string): Observable<CourseGradesData> {
    console.log('🔍 [GRADES-SERVICE] getCourseGrades called with courseId:', courseId, 'type:', typeof courseId);
    const courseIdGuid = courseId;

    return forkJoin({
      evaluaciones: this.getEvaluaciones(courseIdGuid),
      calificaciones: this.getCalificaciones(courseIdGuid),
      estudiantes: this.getEstudiantesPorCurso(courseIdGuid)
    }).pipe(
      map(({ evaluaciones, calificaciones, estudiantes }) =>
        this.mapToCourseGradesData(courseId, evaluaciones, calificaciones, estudiantes)
      )
    );
  }

  /** POST /api/evaluaciones — crea una nueva evaluación */
  crearEvaluacion(payload: EvaluacionPayload): Observable<any> {
    return this.http.post(`${this.evalUrl}/evaluaciones`, {
      cursoId: payload.cursoId,
      docenteId: payload.docenteId,
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      fechaInicio: new Date().toISOString(),
      fechaFin: payload.fechaFin.toISOString(),
      puntajeMaximo: payload.peso,
      tipoEvaluacion: payload.tipo, // entero: 1=Examen, 2=Tarea, 3=Proyecto, 4=Quizz
      intentosPermitidos: 1
    });
  }

  /** POST /api/evaluaciones/{id}/calificaciones — guarda notas en lote */
  guardarCalificaciones(evaluacionId: string, calificaciones: { estudianteId: string; nota: number }[]): Observable<any> {
    return this.http.post(`${this.evalUrl}/evaluaciones/${evaluacionId}/calificaciones`, calificaciones);
  }

  private getEvaluaciones(cursoId: string): Observable<any[]> {
    const url = `${this.evalUrl}/evaluaciones?cursoId=${cursoId}`;
    console.log('🔍 [GRADES-SERVICE] getEvaluaciones URL:', url);
    return this.http.get<any>(url).pipe(
      map(res => res.evaluaciones ?? []),
      catchError(err => {
        console.error('❌ [GRADES] Error al cargar evaluaciones:', err.status, err.statusText, err.error);
        return of([]);
      })
    );
  }

  private getCalificaciones(cursoId: string): Observable<any> {
    return this.http.get<any>(`${this.evalUrl}/evaluaciones/cursos/${cursoId}/calificaciones`).pipe(
      catchError(() => of({ calificaciones: [] }))
    );
  }

  private getEstudiantesPorCurso(cursoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.estudiantesUrl}/estudiantes/por-curso/${cursoId}`).pipe(
      catchError(() => of([]))
    );
  }

  private mapToCourseGradesData(
    courseId: string,
    evaluaciones: any[],
    califResp: any,
    estudiantes: any[]
  ): CourseGradesData {
    // Mapear evaluaciones del endpoint (peso = distribución equitativa: 100/N)
    const totalEvals = evaluaciones?.length || 1;
    const pesoUnitario = Math.round(100 / totalEvals);
    const evalMapped: EvaluacionGrades[] = (evaluaciones || []).map((e: any) => ({
      id: e.id,
      nombre: e.titulo,
      peso: pesoUnitario,
      tipo: e.tipo || 'Tarea'
    }));

    // Mapear estudiantes + notas
    const calificaciones = this.mapCalificaciones(estudiantes, califResp, evalMapped);

    // Calcular estadísticas
    const stats = this.calcStats(calificaciones);

    return {
      courseId,
      courseName: '',
      courseCode: '',
      evaluaciones: evalMapped,
      calificaciones,
      estadisticas: stats
    };
  }

  private mapCalificaciones(estudiantes: any[], califResp: any, evaluaciones: EvaluacionGrades[]): any[] {
    const estudiantesMap = new Map<string, any>();

    // Inicializar cada estudiante con notas vacías
    for (const est of estudiantes) {
      const estId = String(est.estudianteId || est.id || '');
      if (!estId) continue;
      const nombre = est.nombreCompleto || est.nombre || est.email || 'Sin nombre';
      const codigo = est.correoElectronico?.split('@')[0] || estId.slice(0, 8);
      estudiantesMap.set(estId, {
        estudianteId: estId,
        estudianteNombre: nombre,
        estudianteCodigo: codigo,
        notas: {},
        promedio: 0,
        estado: 'Activo'
      });
    }

    // Poblar con las notas del endpoint de calificaciones
    const califList: any[] = califResp?.calificaciones || [];
    for (const calif of califList) {
      const estId = String(calif.estudianteId || '');
      if (!estId || !estudiantesMap.has(estId)) continue;

      const entry = estudiantesMap.get(estId)!;
      const notasPorEval: Record<string, any> = calif.notasPorEvaluacion || {};
      for (const [evalId, nota] of Object.entries(notasPorEval)) {
        entry.notas[evalId] = nota?.nota ?? null;
      }
      // Calcular promedio
      const notasArr = Object.values(entry.notas).filter((n: any) => n != null) as number[];
      entry.promedio = notasArr.length
        ? Number((notasArr.reduce((a, b) => a + b, 0) / notasArr.length).toFixed(2))
        : 0;
    }

    return Array.from(estudiantesMap.values());
  }

  private calcStats(calificaciones: any[]) {
    if (!calificaciones.length) {
      return { promedioGeneral: 0, notaMasAlta: 0, notaMasBaja: 0, aprobados: 0, reprobados: 0, enRiesgo: 0, totalEstudiantes: 0, porcentajeAprobados: 0 };
    }
    const promedios = calificaciones.map(c => c.promedio).filter(p => p > 0);
    const promedioGeneral = promedios.length ? Number((promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2)) : 0;
    const notaMasAlta = promedios.length ? Math.max(...promedios) : 0;
    const notaMasBaja = promedios.length ? Math.min(...promedios) : 0;
    const aprobados = promedios.filter(p => p >= 10.5).length;
    const reprobados = promedios.filter(p => p < 10.5 && p > 0).length;
    const enRiesgo = promedios.filter(p => p >= 10.5 && p < 13).length;
    const total = calificaciones.length;
    const porcentajeAprobados = total ? Math.round((aprobados / total) * 100) : 0;
    return { promedioGeneral, notaMasAlta, notaMasBaja, aprobados, reprobados, enRiesgo, totalEstudiantes: total, porcentajeAprobados };
  }
}
