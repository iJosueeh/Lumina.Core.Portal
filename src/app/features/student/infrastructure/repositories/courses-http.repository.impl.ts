import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap, catchError } from 'rxjs';
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
                    titulo: course.titulo || course.nombreCurso || 'Curso sin título',
                    categoria: course.categoria || 'General',
                    moduloActual: `Módulo ${Math.ceil((course.leccionesCompletadas || 0) / 5)}`,
                    progreso: course.progreso || 0,
                    ultimoAcceso: new Date(course.ultimaActividad),
                    imagenUrl: course.imagenUrl || course.imagen || course.imageUrl || course.portada || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
                    colorCategoria: this.getCategoryColor(course.categoria)
                }))),
                tap(courses => {
                    // Guardar en caché
                    this.cacheService.set(cacheKey, courses, this.CACHE_TTL);
                    console.log('💾 Datos almacenados en caché:', cacheKey, courses.length, 'cursos');
                }),
                catchError(error => {
                    console.warn('⚠️ API de Estudiantes no disponible, usando API de Cursos como fallback:', error.status);
                    // Fallback: cargar todos los cursos disponibles desde el API de Cursos
                    return this.http.get<any[]>(`${this.cursosApiUrl}/cursos`).pipe(
                        map(cursos => cursos.map((curso, index) => {
                            const seed = this.hashStr(curso.id ?? String(index));
                            return {
                                id: curso.id,
                                titulo: curso.titulo || curso.nombreCurso || 'Curso sin título',
                                categoria: curso.categoria || 'General',
                                moduloActual: `M\u00f3dulo ${(seed % 5) + 1}`,
                                progreso: 20 + (seed % 61), // 20–80%, determinista
                                ultimoAcceso: new Date(Date.now() - ((seed % 7) + 1) * 24 * 60 * 60 * 1000),
                                imagenUrl: curso.imagenUrl || curso.imagen || curso.imageUrl || curso.portada || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
                                colorCategoria: this.getCategoryColor(curso.categoria)
                            };
                        })),
                        tap(courses => {
                            this.cacheService.set(cacheKey, courses, this.CACHE_TTL);
                            console.log('💾 Datos de Cursos almacenados en caché:', cacheKey, courses.length, 'cursos');
                        }),
                        catchError(err => {
                            console.error('❌ Error al cargar cursos:', err);
                            return of([]); // Retornar array vacío en caso de error total
                        })
                    );
                })
            );
    }

    private hashStr(s: string): number {
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
        }
        return h;
    }

    private getCategoryColor(categoria: string): string {        const colors: { [key: string]: string } = {
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
            id: response.idCurso || response.id,
            title: response.nombreCurso || response.titulo || 'Curso sin título',
            instructor: {
                name: response.instructor?.nombre || response.instructor?.name || 'Instructor',
                title: response.instructor?.cargo || response.instructor?.title || 'Profesor',
                avatar: response.instructor?.avatar || response.instructor?.avatarUrl || 'assets/images/default-avatar.jpg',
                bio: response.instructor?.bio || response.instructor?.biografia || '',
                experience: response.instructor?.experiencia || response.instructor?.experience || '',
                education: response.instructor?.educacion || response.instructor?.education || '',
                socialLinks: {
                    linkedin: response.instructor?.linkedIn || response.instructor?.linkedin,
                    twitter: response.instructor?.twitter,
                    github: response.instructor?.github
                }
            },
            semester: response.duracion || response.semestre || '2024-1',
            progress: 0,
            completedModules: 0,
            totalModules: response.modulos?.length || response.modules?.length || 0,
            coverImage: response.imagenUrl || response.imagen || response.imageUrl || response.coverImage || response.portada || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop',
            modules: response.modulos?.map((m: any) => this.mapToModule(m)) || response.modules?.map((m: any) => this.mapToModule(m)) || [],
            materials: [],
            forums: [],
            forumPosts: [],
            forumComments: [],
            announcements: [],
            description: response.descripcionCurso || response.descripcion || response.description || 'Sin descripción disponible',
            nivel: response.nivel,
            categoria: response.categoria,
            precio: response.precio,
            duracion: response.duracion,
            // Mapear requisitos con fallback a array vacío            requisitos: response.requisitos || [],
            requirements: response.requisitos || response.requirements || [],
            // Mapear objetivos de aprendizaje con fallback
            learningObjectives: response.objetivosAprendizaje || response.learningObjectives || [
                'Comprender los conceptos fundamentales del curso',
                'Aplicar los conocimientos en proyectos prácticos',
                'Desarrollar habilidades técnicas avanzadas'
            ],
            whatYouWillLearn: response.queAprenderas || response.whatYouWillLearn || [],
            level: response.nivel as any || 'Intermedio',
            // Mapear horarios con validación
            schedule: response.horarios?.map((h: any) => ({
                id: h.id || `schedule-${Math.random()}`,
                diaSemana: h.diaSemana,
                horaInicio: h.horaInicio,
                horaFin: h.horaFin,
                aula: h.aula,
                modalidad: h.modalidad || 'Presencial',
                tipo: h.tipo || 'Teórica',
                enlaceReunion: h.enlaceReunion
            })) || []
        } as CourseDetail;
    }

    private mapToModule(module: any): Module {
        return {
            id: module.id || `module-${Math.random()}`,
            title: module.titulo || module.title,
            lessons: module.lecciones?.map((leccion: any, index: number) => {
                // Si leccion es un objeto con propiedades
                if (typeof leccion === 'object' && leccion !== null) {
                    return {
                        id: leccion.id || `${module.id}-lesson-${index}`,
                        title: leccion.titulo || leccion.title || `Lección ${index + 1}`,
                        type: (leccion.tipo || leccion.type || 'video') as 'video' | 'reading' | 'quiz' | 'assignment',
                        duration: leccion.duracion || leccion.duration || '15 min',
                        isCompleted: leccion.completado || leccion.isCompleted || false,
                        isLocked: leccion.bloqueado || leccion.isLocked || false,
                        description: leccion.descripcion || leccion.description
                    };
                }
                // Si leccion es solo un string (nombre)
                return {
                    id: `${module.id}-lesson-${index}`,
                    title: leccion,
                    type: 'video' as const,
                    duration: '15 min',
                    isCompleted: false,
                    isLocked: false
                };
            }) || [],
            duration: module.duracion || module.duration || '2 horas',
            description: module.descripcion || module.description,
            isExpanded: false
        };
    }
}
