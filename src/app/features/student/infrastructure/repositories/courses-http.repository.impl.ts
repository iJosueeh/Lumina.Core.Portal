import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { CoursesRepository } from '../../domain/repositories/courses.repository';
import { CourseProgress } from '../../domain/models/course-progress.model';
import { CourseDetail, Module, Lesson, Instructor } from '../../domain/models/course-detail.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '../../../../core/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class CoursesHttpRepositoryImpl implements CoursesRepository {
    private readonly estudiantesApiUrl = environment.estudiantesApiUrl;
    private readonly cursosApiUrl = environment.cursosApiUrl;
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

    getCourseDetail(courseId: string): Observable<CourseDetail> {
        const cacheKey = `course-detail-${courseId}`;
        
        // Verificar caché
        const cachedData = this.cacheService.get<CourseDetail>(cacheKey);
        if (cachedData) {
            console.log(`📦 Detalle de curso obtenido del caché: ${courseId}`);
            return of(cachedData);
        }

        console.log(`🌐 Obteniendo detalle de curso desde API: ${courseId}`);
        return this.http.get<any>(`${this.cursosApiUrl}/cursos/${courseId}`)
            .pipe(
                map(response => this.mapToCourseDetail(response)),
                tap(course => {
                    this.cacheService.set(cacheKey, course, this.CACHE_TTL);
                    console.log(`💾 Detalle de curso guardado en caché: ${courseId}`);
                })
            );
    }

    private mapToCourseDetail(response: any): CourseDetail {
        return {
            id: response.id,
            title: response.titulo,
            instructor: {
                name: response.instructor.nombre,
                title: response.instructor.cargo,
                avatar: response.instructor.avatar,
                bio: response.instructor.bio,
                experience: '',
                education: '',
                socialLinks: {
                    linkedin: response.instructor.linkedIn
                }
            },
            semester: response.duracion || '2024-1',
            progress: 0, // Se puede obtener del backend si está disponible
            completedModules: 0,
            totalModules: response.modulos?.length || 0,
            coverImage: response.imagen,
            modules: response.modulos?.map((m: any) => this.mapToModule(m)) || [],
            materials: [], // Se cargará desde Estudiantes API
            forums: [],
            forumPosts: [],
            forumComments: [],
            announcements: [],
            description: response.descripcion,
            nivel: response.nivel,
            categoria: response.categoria,
            precio: response.precio,
            duracion: response.duracion,
            requisitos: response.requisitos
        } as CourseDetail;
    }

    private mapToModule(module: any): Module {
        return {
            id: module.id,
            title: module.titulo,
            lessons: module.lecciones?.map((leccion: string, index: number) => ({
                id: `${module.id}-lesson-${index}`,
                title: leccion,
                type: 'video' as const,
                duration: '15 min',
                isCompleted: false,
                isLocked: false
            })) || [],
            duration: '2 horas',
            isExpanded: false
        };
    }
}
