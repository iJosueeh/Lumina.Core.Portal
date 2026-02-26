import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';

interface Asistencia {
  estudianteId: string;
  estado: 'Presente' | 'Ausente' | 'Tardanza';
  horaLlegada?: string;
  observacion?: string;
}

interface Sesion {
  id: string;
  fecha: string;
  tema: string;
  tipo: string;
  duracion: string;
  asistencias: Asistencia[];
  porcentajeAsistencia: number;
}

interface ResumenEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  totalSesiones: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  porcentajeAsistencia: number;
}

interface AttendanceData {
  courseId: string;
  courseName: string;
  courseCode: string;
  sesiones: Sesion[];
  resumenEstudiantes: ResumenEstudiante[];
}

interface TeacherCourse {
  id: string;
  codigo: string;
  titulo: string;
}

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-management.component.html',
  styles: ``,
})
export class AttendanceManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);

  courses = signal<TeacherCourse[]>([]);
  selectedCourseId = signal<string>('');
  attendanceData = signal<AttendanceData | null>(null);
  selectedSesion = signal<Sesion | null>(null);
  isLoading = signal(true);
  searchTerm = signal('');

  private docenteId = '';
  private studentsCache: { estudianteId: string; estudianteNombre: string }[] = [];

  // Computed values
  sesiones = computed(() => this.attendanceData()?.sesiones || []);
  resumenEstudiantes = computed(() => this.attendanceData()?.resumenEstudiantes || []);

  filteredResumen = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const resumen = this.resumenEstudiantes();
    if (!term) return resumen;
    return resumen.filter((r) => r.estudianteNombre.toLowerCase().includes(term));
  });

  // Estadísticas generales
  promedioAsistencia = computed(() => {
    const resumen = this.resumenEstudiantes();
    if (resumen.length === 0) return 0;
    const total = resumen.reduce((sum, r) => sum + r.porcentajeAsistencia, 0);
    return total / resumen.length;
  });

  totalPresentes = computed(() => {
    const resumen = this.resumenEstudiantes();
    return resumen.reduce((sum, r) => sum + r.presentes, 0);
  });

  totalAusentes = computed(() => {
    const resumen = this.resumenEstudiantes();
    return resumen.reduce((sum, r) => sum + r.ausentes, 0);
  });

  totalTardanzas = computed(() => {
    const resumen = this.resumenEstudiantes();
    return resumen.reduce((sum, r) => sum + r.tardanzas, 0);
  });

  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.loadTeacherData();
  }

  private async loadTeacherData(): Promise<void> {
    try {
      const user = this.authRepo.getCurrentUser();
      const userId = user?.id || (user as any)?.sub || '';

      const teacherInfo = await this.teacherQuery.getTeacherInfo(userId);
      this.docenteId = teacherInfo.id;

      const rawStudents = await firstValueFrom(
        this.http.get<any[]>(`${environment.estudiantesApiUrl}/estudiantes/por-docente/${this.docenteId}`)
      );
      this.studentsCache = (rawStudents || []).map((e: any) => ({
        estudianteId: e.id || e.estudianteId || e.Id,
        estudianteNombre: e.nombre || `${e.nombres ?? ''} ${e.apellidos ?? ''}`.trim(),
      }));

      const courses = await this.teacherQuery.getTeacherCourses(userId);
      const simplified = courses.map((c) => ({ id: c.id, codigo: c.codigo, titulo: c.titulo }));
      this.courses.set(simplified);

      if (simplified.length > 0) {
        this.selectedCourseId.set(simplified[0].id);
        this.buildAttendanceData();
      }
    } catch (err) {
      console.error('❌ [ATTENDANCE] Error loading teacher data:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCourseChange(): void {
    this.buildAttendanceData();
  }

  private buildAttendanceData(): void {
    const courseId = this.selectedCourseId();
    if (!courseId) return;

    const courseIndex = this.courses().findIndex((c) => c.id === courseId);
    const course = this.courses().find((c) => c.id === courseId);
    if (!course) return;

    const data = this.generateAttendanceData(
      courseId, course.titulo, course.codigo, courseIndex, this.studentsCache
    );
    this.attendanceData.set(data);
    this.selectedSesion.set(data.sesiones[0] ?? null);
    console.log(`✅ [ATTENDANCE] Generated ${data.sesiones.length} sesiones for ${course.titulo}`);
  }

  private generateAttendanceData(
    courseId: string,
    courseName: string,
    courseCode: string,
    courseIndex: number,
    students: { estudianteId: string; estudianteNombre: string }[],
  ): AttendanceData {
    const temasByCourse = [
      ['Introducción al curso', 'Fundamentos y conceptos', 'Herramientas del entorno', 'Arquitectura base',
       'Desarrollo práctico I', 'Integración y pruebas', 'Proyecto parcial', 'Revisión y retroalimentación'],
      ['Marco conceptual', 'Infraestructura cloud', 'Servicios y APIs', 'Seguridad y accesos',
       'Despliegue continuo', 'Monitoreo y logs', 'Alta disponibilidad', 'Proyecto integrador'],
      ['Modelo relacional', 'SQL avanzado', 'Índices y rendimiento', 'Transacciones ACID',
       'Procedimientos almacenados', 'Replicación y backup', 'NoSQL vs SQL', 'Optimización final'],
      ['Introducción mobile', 'UI/UX móvil', 'Estado y navegación', 'APIs REST',
       'Almacenamiento local', 'Notificaciones push', 'Testing mobile', 'Publicación en tiendas'],
    ];
    const temas = temasByCourse[courseIndex % temasByCourse.length];
    const tipos = ['Teórica', 'Práctica', 'Teórica', 'Práctica', 'Teórica', 'Taller', 'Evaluación', 'Práctica'];
    const today = new Date();
    const sesiones: Sesion[] = [];

    for (let i = 0; i < 8; i++) {
      const sesionDate = new Date(today);
      sesionDate.setDate(today.getDate() - (7 - i) * 7);
      const baseSeed = (courseIndex + 1) * 100 + i;

      const asistencias: Asistencia[] = students.map((s, sIdx) => {
        const roll = (baseSeed * (sIdx + 1) * 7) % 10;
        let estado: 'Presente' | 'Ausente' | 'Tardanza';
        if (roll <= 1) estado = 'Ausente';
        else if (roll === 2) estado = 'Tardanza';
        else estado = 'Presente';
        return {
          estudianteId: s.estudianteId,
          estado,
          horaLlegada: estado !== 'Ausente'
            ? `18:${estado === 'Tardanza' ? '15' : '00'}`
            : undefined,
        };
      });

      const presentes = asistencias.filter((a) => a.estado === 'Presente' || a.estado === 'Tardanza').length;
      const pct = students.length > 0 ? Math.round((presentes / students.length) * 100) : 0;

      sesiones.push({
        id: `ses-${courseId.slice(0, 8)}-${i}`,
        fecha: sesionDate.toISOString(),
        tema: temas[i] ?? `Sesión ${i + 1}`,
        tipo: tipos[i],
        duracion: '3 horas',
        asistencias,
        porcentajeAsistencia: pct,
      });
    }

    const resumenEstudiantes: ResumenEstudiante[] = students.map((s) => {
      let presentes = 0, ausentes = 0, tardanzas = 0;
      for (const ses of sesiones) {
        const a = ses.asistencias.find((x) => x.estudianteId === s.estudianteId);
        if (a?.estado === 'Presente') presentes++;
        else if (a?.estado === 'Ausente') ausentes++;
        else if (a?.estado === 'Tardanza') tardanzas++;
      }
      const total = sesiones.length;
      const pct = total > 0 ? Math.round(((presentes + tardanzas) / total) * 100) : 0;
      return {
        estudianteId: s.estudianteId,
        estudianteNombre: s.estudianteNombre,
        totalSesiones: total,
        presentes,
        ausentes,
        tardanzas,
        porcentajeAsistencia: pct,
      };
    });

    return { courseId, courseName, courseCode, sesiones, resumenEstudiantes };
  }

  selectSesion(sesion: Sesion): void {
    this.selectedSesion.set(sesion);
  }

  updateAttendance(estudianteId: string, estado: 'Presente' | 'Ausente' | 'Tardanza'): void {
    const sesion = this.selectedSesion();
    if (!sesion) return;

    const asistencia = sesion.asistencias.find((a) => a.estudianteId === estudianteId);
    if (asistencia) {
      asistencia.estado = estado;
      // Recalcular porcentaje
      const totalPresentes = sesion.asistencias.filter(
        (a) => a.estado === 'Presente' || a.estado === 'Tardanza',
      ).length;
      sesion.porcentajeAsistencia = Math.round((totalPresentes / sesion.asistencias.length) * 100);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      Presente: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Ausente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      Tardanza: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  getAsistenciaColor(porcentaje: number): string {
    if (porcentaje >= 90) return 'text-green-400';
    if (porcentaje >= 75) return 'text-orange-400';
    return 'text-red-400';
  }

  exportToCSV(): void {
    const data = this.attendanceData();
    const resumen = this.filteredResumen();
    if (!data || resumen.length === 0) return;

    const headers = ['Estudiante', 'Total Sesiones', 'Presentes', 'Ausentes', 'Tardanzas', 'Asistencia %'];
    const rows = resumen.map((r) => [
      `"${r.estudianteNombre}"`,
      r.totalSesiones,
      r.presentes,
      r.ausentes,
      r.tardanzas,
      r.porcentajeAsistencia.toFixed(1) + '%',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencia_${data.courseCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
