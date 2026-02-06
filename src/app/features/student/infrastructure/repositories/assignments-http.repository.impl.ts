import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { AssignmentsRepository } from '../../domain/repositories/assignments.repository';
import { Assignment } from '../../domain/models/assignment.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '@core/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class AssignmentsHttpRepositoryImpl implements AssignmentsRepository {
    private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;
    private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getUpcomingAssignments(studentId: string): Observable<Assignment[]> {
        const cacheKey = `student-assignments-${studentId}`;
        
        // Verificar caché
        const cachedData = this.cacheService.get<Assignment[]>(cacheKey);
        if (cachedData) {
            console.log(`📦 Assignments obtenidos del caché para estudiante ${studentId}`);
            return of(cachedData);
        }

        console.log(`🌐 Obteniendo assignments desde API para estudiante ${studentId}`);
        return this.http.get<any[]>(`${this.evaluacionesApiUrl}/Evaluaciones?estudianteId=${studentId}`)
            .pipe(
                map(assignments => assignments
                    .filter(a => new Date(a.fechaLimite) > new Date()) // Solo futuras
                    .map(assignment => {
                        const dueDate = new Date(assignment.fechaLimite);
                        const today = new Date();
                        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        return {
                            id: assignment.id,
                            titulo: assignment.titulo,
                            cursoNombre: assignment.cursoNombre,
                            fechaLimite: dueDate,
                            esUrgente: daysUntil <= 3,
                            mes: dueDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
                            dia: dueDate.getDate()
                        };
                    })
                    .sort((a, b) => a.fechaLimite.getTime() - b.fechaLimite.getTime())
                    .slice(0, 5) // Top 5
                ),
                tap(assignments => {
                    // Guardar en caché
                    this.cacheService.set(cacheKey, assignments, this.CACHE_TTL);
                    console.log(`💾 Assignments guardados en caché (TTL: ${this.CACHE_TTL / 1000}s)`);
                })
            );
    }
}
