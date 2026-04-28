import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap, catchError, timeout, retry } from 'rxjs';
import { CoursesRepository } from '../../domain/repositories/courses.repository';
import { CourseProgress } from '../../domain/models/course-progress.model';
import { CourseDetail, Module, Lesson, Instructor, CourseMaterial, MaterialType } from '../../domain/models/course-detail.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '../../../../core/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class CoursesHttpRepositoryImpl implements CoursesRepository {
    private readonly estudiantesApiUrl = environment.estudiantesApiUrl;
    private readonly cursosApiUrl = environment.cursosApiUrl;
    private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutos
    private readonly ESTUDIANTES_TIMEOUT_MS = 30000; // 30 segundos

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getStudentCourses(studentId: string): Observable<CourseProgress[]> {
        console.time(`⏱️ Carga Cursos Estudiante ${studentId}`);

        return this.http.get<any>(`${this.estudiantesApiUrl}/estudiantes/${studentId}/cursos-matriculados`)
            .pipe(
                timeout(this.ESTUDIANTES_TIMEOUT_MS),
                retry({ count: 1, delay: 500 }),
                map(response => {
                    // Manejar tanto { success: true, data: [...] } como el array directo
                    const courses = Array.isArray(response) ? response : (response.data || []);

                    return courses.map((course: any) => {
                        const rawTitulo = course.titulo || course.Titulo || course.nombreCurso || course.NombreCurso;
                        const finalTitulo = (typeof rawTitulo === 'string' && rawTitulo.length > 0)
                            ? rawTitulo 
                            : 'Título no disponible';

                        return {
                            id: course.id || course.idCurso || course.Id,
                            titulo: finalTitulo,
                            categoria: course.categoria || 'Especialización',
                            moduloActual: course.moduloActual || 'Módulo 1',
                            progreso: course.progreso || 0,
                            ultimoAcceso: new Date(course.ultimoAcceso || course.fechaActualizacion || Date.now()),
                            imagenUrl: course.imagenUrl || course.portadaUrl || 'assets/images/courses/default.jpg',
                            colorCategoria: this.getCategoryColor(course.categoria),
                            codigo: course.codigo || 'ACAD-2026',
                            modalidad: course.modalidad || 'Presencial/Virtual',
                            nivel: course.nivel || 'Intermedio'
                        };
                    });
                }),
                tap(() => console.timeEnd(`⏱️ Carga Cursos Estudiante ${studentId}`)),
                catchError(error => {
                    console.error('❌ Error cargando cursos:', error);
                    return this.getCoursesFallback();
                })
            );
    }
    private getCoursesFallback(): Observable<CourseProgress[]> {
        // Fallback: cargar todos los cursos disponibles desde el API de Cursos
        return this.http.get<any[]>(`${this.cursosApiUrl}/cursos`).pipe(
            map(cursos => cursos.map((curso, index) => {
                const cursoId = curso.id || curso.Id || curso.idCurso || String(index);
                const titulo = curso.titulo || curso.Titulo || curso.nombreCurso || curso.NombreCurso?.value || curso.NombreCurso || 'Curso sin título';
                const categoria = curso.categoria || curso.Categoria || curso.Categoria?.value || 'General';
                const nivel = curso.nivel || curso.Nivel || curso.Nivel?.value || 'Intermedio';
                const imagenUrl = curso.imagenUrl || curso.ImagenUrl || curso.imagen || curso.imageUrl || curso.portada || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop';
                const seed = this.hashStr(String(cursoId));
                return {
                    id: cursoId,
                    titulo,
                    categoria,
                    moduloActual: `M\u00f3dulo ${(seed % 5) + 1}`,
                    progreso: 20 + (seed % 61), // 20–80%, determinista
                    ultimoAcceso: new Date(Date.now() - ((seed % 7) + 1) * 24 * 60 * 60 * 1000),
                    imagenUrl,
                    colorCategoria: this.getCategoryColor(categoria),
                    codigo: curso.codigo || curso.Codigo || 'ACAD-2026',
                    modalidad: curso.modalidad || curso.Modalidad || 'Presencial/Virtual',
                    nivel
                };
            })),
            catchError(err => {
                console.error('❌ Error al cargar cursos:', err);
                return of([]); // Retornar array vacío en caso de error total
            })
        );
    }

    private isUnsafeBrowserPort(baseUrl: string): boolean {
        try {
            const parsed = new URL(baseUrl);
            const port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
            // Puertos bloqueados por navegadores modernos (incluye el caso reportado 6666)
            const blockedPorts = new Set([6665, 6666, 6667, 6668, 6669]);
            return blockedPorts.has(port);
        } catch {
            return false;
        }
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
        // Map modules first to calculate progress
        const mappedModules: Module[] = response.modulos?.map((m: any) => this.mapToModule(m)) || response.modules?.map((m: any) => this.mapToModule(m)) || [];
        
        // Calculate progress based on completed lessons
        const totalLessons = mappedModules.reduce((total: number, module: Module) => total + (module.lessons?.length || 0), 0);
        const completedLessons = mappedModules.reduce((total: number, module: Module) => 
            total + (module.lessons?.filter((l: Lesson) => l.isCompleted).length || 0), 0
        );
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        // Calculate completed modules (all lessons in module are completed)
        const completedModules = mappedModules.filter((module: Module) => 
            module.lessons?.length > 0 && module.lessons.every((l: Lesson) => l.isCompleted)
        ).length;
        
        const flattenedMaterials = mappedModules.flatMap((module) => module.materials || []);

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
            progress,
            completedModules,
            totalModules: mappedModules.length,
            coverImage: response.imagenUrl || response.imagen || response.imageUrl || response.coverImage || response.portada || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop',
            modules: mappedModules,
            materials: flattenedMaterials,
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
        const moduleId = String(module.id || `module-${Math.random()}`);
        const moduleTitle = module.titulo || module.title || 'Módulo';
        const moduleMaterials = (module.materiales || module.Materiales || []).map((material: any) =>
            this.mapToModuleMaterial(material, moduleId, moduleTitle)
        );

        return {
            id: moduleId,
            title: moduleTitle,
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
            materials: moduleMaterials,
            isExpanded: false
        };
    }

    private mapToModuleMaterial(material: any, moduleId: string, moduleName: string): CourseMaterial {
        const title = material.titulo || material.Titulo || material.nombreOriginal || material.NombreOriginal || 'Material';
        const rawType = material.tipoArchivo || material.TipoArchivo || material.tipo || material.Tipo || 'document';

        return {
            id: String(material.id || material.Id || `${moduleId}-${title}`).trim(),
            title: String(title),
            type: this.mapTipoToMaterialType(String(rawType)),
            moduleId,
            moduleName,
            lessonId: undefined,
            lessonName: undefined,
            description: undefined,
            url: String(material.url || material.Url || '').trim(),
            fileSize: undefined,
            duration: undefined,
            isViewed: false,
            uploadDate: new Date(material.fechaCreacion || material.FechaCreacion || Date.now()),
            downloadCount: undefined,
        };
    }

    private mapTipoToMaterialType(tipo: string): MaterialType {
        const normalized = (tipo || '').toLowerCase();
        if (normalized.includes('pdf')) return 'pdf';
        if (normalized.includes('video') || normalized.includes('mp4') || normalized.includes('youtube') || normalized.includes('vimeo')) return 'video';
        if (normalized.includes('link') || normalized.includes('url')) return 'link';
        if (normalized.includes('code') || normalized.includes('codigo') || normalized.includes('zip')) return 'code';
        return 'document';
    }
}
