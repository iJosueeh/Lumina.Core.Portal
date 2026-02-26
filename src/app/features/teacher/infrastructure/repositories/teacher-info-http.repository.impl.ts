import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { TeacherInfoRepository } from '../../domain/repositories/teacher-info.repository';
import { TeacherInfo } from '../../domain/models/teacher-info.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeacherInfoHttpRepositoryImpl extends TeacherInfoRepository {
  private readonly docentesApiUrl = environment.docentesApiUrl;

  constructor(private http: HttpClient) {
    super();
  }

  override getTeacherInfo(teacherId: string): Observable<TeacherInfo> {
    console.log(`🔍 [TEACHER-INFO] Obteniendo información del docente desde API (usuarioId): ${teacherId}`);
    
    // Usando el nuevo endpoint by-usuario que busca por usuarioId
    return this.http.get<any>(`${this.docentesApiUrl}/docente/by-usuario/${teacherId}`).pipe(
      map(response => {
        console.log('✅ [TEACHER-INFO] Respuesta del backend:', response);
        return {
          id: response.id.value,
          usuarioId: response.usuarioId,
          especialidadId: response.especialidadId.value,
          nombre: response.nombre,
          cargo: response.cargo,
          bio: response.bio,
          avatar: response.avatar,
          linkedIn: response.linkedIn
        };
      }),
      catchError(error => {
        console.error('❌ [TEACHER-INFO] Error obteniendo información del docente:', error);
        // Fallback: retornar información básica
        return of({
          id: teacherId,
          usuarioId: teacherId,
          especialidadId: '',
          nombre: 'Docente',
          cargo: 'Profesor',
          bio: '',
          avatar: '',
          linkedIn: ''
        });
      })
    );
  }
}
