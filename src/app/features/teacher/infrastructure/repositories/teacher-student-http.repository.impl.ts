import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map, catchError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TeacherStudentRepository } from '../../domain/repositories/teacher-student.repository';
import { TeacherStudent } from '../../domain/models/teacher-student.model';

interface EstudiantePorDocenteResponse {
  estudianteId: string;
  usuarioId: string;
  nombreCompleto: string;
  correoElectronico: string;
  cursos: { cursoId: string; codigoCurso: string; nombreCurso: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class TeacherStudentHttpRepositoryImpl extends TeacherStudentRepository {
  private http = inject(HttpClient);

  override getStudentsByTeacher(usuarioId: string): Observable<TeacherStudent[]> {
    const docentesApiUrl = environment.docentesApiUrl;
    const estudiantesApiUrl = environment.estudiantesApiUrl;

    console.log('📋 [TEACHER-STUDENTS-HTTP] Obteniendo estudiantes para docente (usuarioId):', usuarioId);

    // Paso 1: GET docenteId a partir del usuarioId
    return this.http.get<any>(`${docentesApiUrl}/docente/by-usuario/${usuarioId}`).pipe(
      switchMap((docenteResponse): Observable<TeacherStudent[]> => {
        const docenteId =
          docenteResponse.value?.id?.value ||
          docenteResponse.value?.id ||
          docenteResponse.id?.value ||
          docenteResponse.id;

        if (!docenteId) {

          return of([]);
        }

        // Paso 2: Llamada única al endpoint optimizado del backend
        return this.http
          .get<EstudiantePorDocenteResponse[]>(
            `${estudiantesApiUrl}/estudiantes/por-docente/${docenteId}`
          )
          .pipe(
            map((estudiantes) => {

              return estudiantes.map((e) => this.mapToTeacherStudent(e));
            }),
            catchError((error) => {

              return of([]);
            })
          );
      }),
      catchError((error) => {

        return of([]);
      })
    );
  }

  private mapToTeacherStudent(e: EstudiantePorDocenteResponse): TeacherStudent {
    return {
      id: e.estudianteId,
      usuarioId: e.usuarioId,
      nombreCompleto: e.nombreCompleto,
      email: e.correoElectronico,
      cursos: e.cursos.map((c) => c.cursoId),
    };
  }
}
