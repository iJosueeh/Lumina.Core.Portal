import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { CoursesRepository } from '../../domain/repositories/courses.repository';
import { CourseProgress } from '../../domain/models/course-progress.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '../../../../core/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class CoursesHttpRepositoryImpl implements CoursesRepository {
    private readonly estudiantesApiUrl = environment.estudiantesApiUrl;
    private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getStudentCourses(studentId: string): Observable<CourseProgress[]> {
        const cacheKey = `student-courses-${studentId}`;
        
        // Verificar si existe en caché
        const cachedData = this.cacheService.get<CourseProgress[]>(cacheKey);
        if (cachedData) {
            console.log('✅ Datos obtenidos del caché:', cacheKey);
            return of(cachedData);
        }

        console.log('📡 Realizando petición HTTP:', cacheKey);
        return this.http.get<any[]>(`${this.estudiantesApiUrl}/estudiantes/${studentId}/cursos-matriculados`)
            .pipe(
                map(courses => courses.map(course => ({
                    id: course.id,
                    titulo: course.titulo,
                    categoria: course.categoria || 'General',
                    moduloActual: `Módulo ${Math.ceil((course.leccionesCompletadas || 0) / 5)}`,
                    progreso: course.progreso || 0,
                    ultimoAcceso: new Date(course.ultimaActividad),
                    imagenUrl: course.imagenUrl || course.imagen || 'assets/images/courses/default.jpg',
                    colorCategoria: this.getCategoryColor(course.categoria)
                }))),
                tap(courses => {
                    // Guardar en caché
                    this.cacheService.set(cacheKey, courses, this.CACHE_TTL);
                    console.log('💾 Datos almacenados en caché:', cacheKey, courses.length, 'cursos');
                })
            );
    }

    private getCategoryColor(categoria: string): string {
        const colors: { [key: string]: string } = {
            'Desarrollo Backend': '#3b82f6',
            'Desarrollo Frontend': '#10b981',
            'Base de Datos': '#f59e0b',
            'DevOps': '#8b5cf6',
            'General': '#6b7280'
        };
        return colors[categoria] || colors['General'];
    }
}
