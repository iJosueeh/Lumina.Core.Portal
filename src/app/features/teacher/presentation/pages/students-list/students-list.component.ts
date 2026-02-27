import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { useTeacherStudents } from '@features/teacher/infrastructure/queries/teacher-query-hooks';
import { TeacherStudent } from '@features/teacher/domain/models/teacher-student.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { EstudianteMetricasService } from '@features/teacher/infrastructure/services/estudiante-metricas.service';
import { EstudianteMetricasCompletas } from '@features/teacher/domain/models/estudiante-metricas.model';
import { firstValueFrom } from 'rxjs';

interface CourseStudent {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  email: string;
  avatar: string;
  promedio: number;
  asistencia: number;
  tareasEntregadas: number;
  tareasPendientes: number;
  estado: string;
  ultimoAcceso: string;
  courseId?: string;
  courseName?: string;
}

interface CourseFilter {
  id: string;
  name: string;
}

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './students-list.component.html',
  styles: ``,
})
export class StudentsListComponent {
  private router = inject(Router);
  private authRepository = inject(AuthRepository);
  private courseRepository = inject(TeacherCourseRepository);
  private metricasService = inject(EstudianteMetricasService);
  
  // Obtener usuario actual del AuthRepository
  private currentUserId = computed(() => this.authRepository.getCurrentUser()?.id ?? '');
  
  // TanStack Query hook
  studentsQuery = useTeacherStudents(this.currentUserId());
  
  // Signals para filtros
  searchTerm = signal('');
  selectedCourse = signal<string>('all');
  selectedStatus = signal<string>('all');

  // Caché de nombres de cursos para evitar múltiples peticiones
  private courseNamesCache = signal<Map<string, string>>(new Map());
  
  // Caché de métricas de estudiantes
  private metricasCache = signal<Map<string, EstudianteMetricasCompletas>>(new Map());

  // Caché de últimos accesos de usuarios
  private ultimosAccesosCache = signal<Map<string, string | null>>(new Map());

  // Transformar estudiantes del backend al formato de la UI
  allStudents = computed(() => {
    const students = this.studentsQuery.data() || [];
    return students.map((s: TeacherStudent) => this.transformToUIStudent(s));
  });

  isLoading = computed(() => this.studentsQuery.isLoading());
  isError = computed(() => this.studentsQuery.isError());
  error = computed(() => this.studentsQuery.error());

  constructor() {
    // Cargar nombres de cursos, métricas y últimos accesos cuando haya estudiantes
    effect(() => {
      const students = this.allStudents();
      if (students.length > 0) {
        this.loadCourseNames(students);
        this.loadStudentMetrics(students);
        this.loadUltimosAccesos(students);
      }
    });
  }

  // Computed values
  courses = computed(() => {
    const students = this.allStudents();
    const uniqueCourses = new Map<string, string>();
    
    students.forEach((student: CourseStudent) => {
      if (student.courseId && student.courseName) {
        uniqueCourses.set(student.courseId, student.courseName);
      }
    });

    return Array.from(uniqueCourses.entries()).map(([id, name]) => ({ id, name }));
  });

  filteredStudents = computed(() => {
    let students = this.allStudents();

    // Filtrar por curso
    if (this.selectedCourse() !== 'all') {
      students = students.filter((s: CourseStudent) => s.courseId === this.selectedCourse());
    }

    // Filtrar por estado
    if (this.selectedStatus() !== 'all') {
      students = students.filter((s: CourseStudent) => s.estado === this.selectedStatus());
    }

    // Filtrar por búsqueda
    const term = this.searchTerm().toLowerCase();
    if (term) {
      students = students.filter(
        (s: CourseStudent) =>
          s.nombre.toLowerCase().includes(term) ||
          s.apellidos.toLowerCase().includes(term) ||
          s.codigo.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term),
      );
    }

    return students;
  });

  totalStudents = computed(() => this.allStudents().length);
  activeStudents = computed(() => this.allStudents().filter((s: CourseStudent) => s.estado === 'Activo').length);
  atRiskStudents = computed(() => this.allStudents().filter((s: CourseStudent) => s.estado === 'En Riesgo').length);

  /**
   * Transforma un estudiante del backend al formato de la UI
   * Integra métricas reales desde el API de Evaluaciones (promedio, tareas)
   * NOTA: Asistencia y UltimoAcceso aún son mock (pendientes de implementación de sus APIs)
   */
  private transformToUIStudent(student: TeacherStudent): CourseStudent {
    const [nombre, ...apellidosArr] = student.nombreCompleto.split(' ');
    const apellidos = apellidosArr.join(' ');
    
    // Extraer el primer curso como curso principal (temporal)
    const courseId = student.cursos[0] || '';
    
    // Obtener métricas reales desde la caché
    const metricas = this.metricasCache().get(student.id);
    
    return {
      id: student.id,
      codigo: student.usuarioId.substring(0, 8).toUpperCase(),
      nombre: nombre,
      apellidos: apellidos,
      email: student.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.nombreCompleto)}&background=0D8ABC&color=fff`,
      // MÉTRICAS REALES desde API de Evaluaciones
      promedio: metricas?.promedioGeneral ?? 0,
      tareasEntregadas: metricas?.tareasEntregadas ?? 0,
      tareasPendientes: metricas?.tareasPendientes ?? 0,
      // MOCK DATA temporal: Asistencia (API pendiente de implementación)
      asistencia: metricas?.asistencia ?? this.generateMockAttendance(student.id),
      estado: this.calculateEstudianteStatus(metricas),
      // DATO REAL: UltimoAcceso desde API de Usuarios
      ultimoAcceso: this.ultimosAccesosCache().get(student.usuarioId) ?? this.generateMockLastAccess(student.id),
      courseId: courseId,
      courseName: this.getCourseName(courseId),
    };
  }

  /**
   * Calcula el estado del estudiante basado en sus métricas reales
   */
  private calculateEstudianteStatus(metricas: EstudianteMetricasCompletas | undefined): string {
    if (!metricas) return 'Activo';
    
    const promedio = metricas.promedioGeneral;
    const asistencia = metricas.asistencia ?? 100;
    
    // En riesgo si: promedio < 14 o asistencia < 75%
    if (promedio < 14 || asistencia < 75) {
      return 'En Riesgo';
    }
    
    // Inactivo si: promedio = 0 (sin evaluaciones completadas)
    if (promedio === 0 && metricas.evaluacionesCompletadas === 0) {
      return 'Inactivo';
    }
    
    return 'Activo';
  }

  // Métodos auxiliares deterministas basados en hash del ID
  private hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  private deterministicInt(seed: string, min: number, max: number): number {
    return min + (this.hashCode(seed) % (max - min + 1));
  }

  private generateMockAttendance(id: string): number {
    return 70 + (this.hashCode(id + 'att') % 31); // 70-100%, fijo por estudiante
  }

  private generateMockLastAccess(id: string): string {
    const now = new Date();
    const hoursAgo = this.hashCode(id + 'acc') % 48; // 0-47h, fijo por estudiante
    now.setHours(now.getHours() - hoursAgo);
    return now.toISOString();
  }

  /**
   * Carga las métricas reales de estudiantes desde el API de Evaluaciones
   */
  private async loadStudentMetrics(students: CourseStudent[]): Promise<void> {
    const estudianteIds = students.map(s => s.id);
    const cache = this.metricasCache();
    
    // Filtrar estudiantes sin métricas en caché
    const idsToLoad = estudianteIds.filter(id => !cache.has(id));
    
    if (idsToLoad.length === 0) {
      return;
    }

    console.log(`📊 [STUDENTS-LIST] Cargando métricas de ${idsToLoad.length} estudiantes...`);

    try {
      const metricasMap = await firstValueFrom(
        this.metricasService.getMetricasMultiplesEstudiantes(idsToLoad)
      );
      
      // Actualizar caché inmutablemente
      const newCache = new Map(cache);
      metricasMap.forEach((metricas, id) => newCache.set(id, metricas));
      this.metricasCache.set(newCache);

      console.log('✅ [STUDENTS-LIST] Métricas de estudiantes cargadas');
    } catch (error) {
      console.error('❌ [STUDENTS-LIST] Error cargando métricas:', error);
    }
  }

  /**
   * Carga los últimos accesos de múltiples estudiantes desde el API de Usuarios
   */
  private async loadUltimosAccesos(students: CourseStudent[]): Promise<void> {
    // Obtener los usuarioIds únicos
    const backendStudents = this.studentsQuery.data() || [];
    const usuarioIds = backendStudents.map((s: TeacherStudent) => s.usuarioId);
    const cache = this.ultimosAccesosCache();
    
    // Filtrar usuarios sin último acceso en caché
    const idsToLoad = usuarioIds.filter(id => !cache.has(id));
    
    if (idsToLoad.length === 0) {
      return;
    }

    console.log(`🕒 [STUDENTS-LIST] Cargando últimos accesos de ${idsToLoad.length} usuarios...`);

    try {
      const accesosMap = await firstValueFrom(
        this.metricasService.getUltimosAccesos(idsToLoad)
      );
      
      // Actualizar caché inmutablemente
      const newCache = new Map(cache);
      accesosMap.forEach((acceso, usuarioId) => newCache.set(usuarioId, acceso));
      this.ultimosAccesosCache.set(newCache);

      console.log('✅ [STUDENTS-LIST] Últimos accesos cargados');
    } catch (error) {
      console.error('❌ [STUDENTS-LIST] Error cargando últimos accesos:', error);
    }
  }

  private getCourseName(cursoId: string): string {
    // Buscar en la caché primero
    const cached = this.courseNamesCache().get(cursoId);
    if (cached) {
      return cached;
    }
    
    // Si no está en caché, retornar un placeholder
    return 'Cargando...';
  }

  /**
   * Carga los nombres de cursos desde el API
   */
  private async loadCourseNames(students: CourseStudent[]): Promise<void> {
    // Obtener todos los IDs de cursos únicos
    const courseIds = new Set<string>();
    students.forEach(student => {
      if (student.courseId) {
        courseIds.add(student.courseId);
      }
    });

    // Cargar solo los cursos que no están en caché
    const cache = this.courseNamesCache();
    const coursesToLoad = Array.from(courseIds).filter(id => !cache.has(id));

    if (coursesToLoad.length === 0) {
      return;
    }

    console.log(`📚 [STUDENTS-LIST] Cargando nombres de ${coursesToLoad.length} cursos...`);

    // Cargar todos los cursos en paralelo
    try {
      const coursePromises = coursesToLoad.map(courseId =>
        firstValueFrom(this.courseRepository.getCourseById(courseId))
          .then(course => ({ id: courseId, name: course.titulo }))
          .catch(error => {
            console.warn(`⚠️ [STUDENTS-LIST] Error cargando curso ${courseId}:`, error);
            return { id: courseId, name: 'Curso sin nombre' };
          })
      );

      const courses = await Promise.all(coursePromises);
      
      // Actualizar la caché
      const newCache = new Map(cache);
      courses.forEach(({ id, name }) => newCache.set(id, name));
      this.courseNamesCache.set(newCache);

      console.log('✅ [STUDENTS-LIST] Nombres de cursos cargados');
    } catch (error) {
      console.error('❌ [STUDENTS-LIST] Error cargando nombres de cursos:', error);
    }
  }

  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      Activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Inactivo: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  viewStudentDetails(studentId: string): void {
    this.router.navigate(['/teacher/student', studentId]);
  }

  exportToCSV(): void {
    const students = this.filteredStudents();
    if (students.length === 0) return;

    const headers = ['Nombre', 'Apellidos', 'Código', 'Email', 'Curso', 'Promedio', 'Asistencia %', 'Estado'];
    const rows = students.map((s: CourseStudent) => [
      `"${s.nombre}"`,
      `"${s.apellidos}"`,
      s.codigo,
      s.email,
      `"${s.courseName ?? ''}"`,
      s.promedio.toFixed(2),
      s.asistencia.toFixed(1) + '%',
      s.estado,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estudiantes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

