import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { NotificationService } from '@shared/services/notification.service';
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';
import { environment } from '@environments/environment';

export interface ActividadItem {
  t: string;
  r: string;
  d?: number;
  h?: string;
}

export interface AsistenciaRegistro {
  id: string;
  estudianteId: string;
  estado: 'Activo' | 'Pendiente';
  observacion: string | null;
  fecha: string;
}

export interface AttendanceStats {
  studentId: string;
  studentName: string;
  total: number;
  activos: number;
  pendientes: number;
  porcentaje: number;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastActivityAt: string | null;
}

export interface AttendanceCourse {
  id: string;
  codigo: string;
  titulo: string;
}

export interface StudentDetailModalData {
  studentId: string;
  studentName: string;
  actividades: ActividadItem[];
  porcentaje: number;
  totalLecciones: number;
  totalMinutos: number;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastActivityAt: string | null;
}

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, StatCardComponent],
  templateUrl: './attendance-management.component.html',
})
export class AttendanceManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);
  private notification = inject(NotificationService);

  // State
  courses = signal<AttendanceCourse[]>([]);
  selectedCourseId = signal<string>('');
  selectedDate = signal<string>(new Date().toLocaleDateString('sv'));
  isLoading = signal(false);
  searchTerm = signal('');

  // Timeline / Student Telemetry Modal
  selectedStudentDetail = signal<StudentDetailModalData | null>(null);

  // Live attendance & metrics
  dateAttendance = signal<AsistenciaRegistro[]>([]);
  allStats = signal<AttendanceStats[]>([]);

  // Private cache
  private docenteId = '';
  private studentsCache = new Map<string, { id: string; nombre: string }[]>();

  filteredStats = computed(() => {
    const stats = this.allStats();
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return stats;
    return stats.filter(s => s.studentName.toLowerCase().includes(term));
  });

  averageProgress = computed(() => {
    const stats = this.allStats();
    if (!stats.length) return 0;
    const sum = stats.reduce((acc, s) => acc + (s.progressPercent || 0), 0);
    return Math.round(sum / stats.length);
  });

  totalCompletedLessons = computed(() => {
    return this.allStats().reduce((acc, s) => acc + (s.completedLessons || 0), 0);
  });

  totalMinutosHoy = computed(() => {
    let sum = 0;
    this.dateAttendance().forEach(reg => {
      const acts = this.parseActividades(reg.observacion);
      acts.forEach(a => {
        if (a.d) sum += a.d;
      });
    });
    return sum;
  });

  activeStudentsCount = computed(() => {
    return this.allStats().filter(s => (s.completedLessons || 0) > 0 || this.getStudentMinutosHoy(s.studentId) > 0).length;
  });

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
  }

  async onRefresh(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.loadAttendanceForDate(),
        this.loadAllStats(),
      ]);
      this.notification.show('success', 'Progreso de aula virtual actualizado.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onCourseChange(): Promise<void> {
    this.dateAttendance.set([]);
    await Promise.all([
      this.loadAttendanceForDate(),
      this.loadAllStats(),
    ]);
  }

  async onDateChange(): Promise<void> {
    await this.loadAttendanceForDate();
  }

  private async loadCourses(): Promise<void> {
    try {
      const user = this.authRepo.getCurrentUser();
      const userId = user?.id || (user as any)?.sub || '';

      const teacherInfo = await this.teacherQuery.getTeacherInfo(userId);
      this.docenteId = teacherInfo.id;

      const courses = await this.teacherQuery.getTeacherCourses(userId);
      this.courses.set(courses.map((c) => ({ id: c.id, codigo: c.codigo, titulo: c.titulo })));

      if (this.courses().length > 0) {
        this.selectedCourseId.set(this.courses()[0].id);
        await Promise.all([
          this.loadAttendanceForDate(),
          this.loadAllStats(),
        ]);
      }
    } catch {
      this.notification.show('error', 'Error al cargar los cursos asignados.');
    }
  }

  private async loadAttendanceForDate(): Promise<void> {
    const courseId = this.selectedCourseId();
    const fecha = this.selectedDate();
    if (!courseId || !fecha) return;

    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<any>(`${environment.estudiantesApiUrl}/asistencias?cursoId=${courseId}&fecha=${fecha}`)
      );
      const records: AsistenciaRegistro[] = (data.value || data || []).map((r: any) => ({
        id: r.id,
        estudianteId: r.estudianteId,
        estado: r.estado === 'Activo' ? 'Activo' : 'Pendiente',
        observacion: r.observacion || null,
        fecha: r.fecha,
      }));
      this.dateAttendance.set(records);
    } catch {
      this.dateAttendance.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAllStats(): Promise<void> {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      this.allStats.set([]);
      return;
    }

    try {
      const students = await this.getStudentsForCourse(courseId);
      if (!students.length) {
        this.allStats.set([]);
        return;
      }

      // Fetch batch virtual classroom progress
      const progressMap = new Map<string, { progressPercent: number; completedLessons: number; totalLessons: number; lastActivityAt: string | null }>();
      try {
        const studentIdsParam = students.map(s => s.id).join(',');
        const batchResults = await firstValueFrom(
          this.http.get<any[]>(`${environment.estudiantesApiUrl}/matricula/aula-virtual-progress/batch?cursoId=${courseId}&estudianteIds=${studentIdsParam}`)
        );
        if (Array.isArray(batchResults)) {
          batchResults.forEach(r => {
            progressMap.set(r.estudianteId, {
              progressPercent: r.progressPercent ?? 0,
              completedLessons: r.completedLessons ?? 0,
              totalLessons: r.totalLessons ?? 0,
              lastActivityAt: r.lastActivityAt ?? null,
            });
          });
        }
      } catch {
        // Fallback silently if batch endpoint is not populated yet
      }

      // Parallelize student metric requests with Promise.all
      const statsPromises = students.map(async (student) => {
        const prog = progressMap.get(student.id);
        try {
          const data = await firstValueFrom(
            this.http.get<any>(`${environment.estudiantesApiUrl}/asistencias/resumen?estudianteId=${student.id}&cursoId=${courseId}`)
          );
          const activos = data?.activos ?? data?.presentes ?? 0;
          const pendientes = data?.pendientes ?? data?.ausentes ?? 0;
          const total = data?.totalClases ?? (activos + pendientes);
          const porcentaje = data?.porcentajeAsistencia ?? (total > 0 ? Math.round((activos / total) * 100) : 0);

          return {
            studentId: student.id,
            studentName: student.nombre,
            total,
            activos,
            pendientes,
            porcentaje,
            progressPercent: prog?.progressPercent ?? (prog?.totalLessons ? Math.round((prog.completedLessons / prog.totalLessons) * 100) : 0),
            completedLessons: prog?.completedLessons ?? 0,
            totalLessons: prog?.totalLessons ?? 0,
            lastActivityAt: prog?.lastActivityAt ?? null,
          };
        } catch {
          return {
            studentId: student.id,
            studentName: student.nombre,
            total: 0,
            activos: 0,
            pendientes: 0,
            porcentaje: 0,
            progressPercent: prog?.progressPercent ?? 0,
            completedLessons: prog?.completedLessons ?? 0,
            totalLessons: prog?.totalLessons ?? 0,
            lastActivityAt: prog?.lastActivityAt ?? null,
          };
        }
      });

      const stats = await Promise.all(statsPromises);
      this.allStats.set(stats);
    } catch {
      this.allStats.set([]);
    }
  }

  private async getStudentsForCourse(courseId: string): Promise<{ id: string; nombre: string }[]> {
    if (this.studentsCache.has(courseId)) {
      return this.studentsCache.get(courseId)!;
    }
    try {
      const students = await firstValueFrom(
        this.http.get<any[]>(`${environment.estudiantesApiUrl}/estudiantes/por-curso/${courseId}`)
      );
      const mapped = (students || []).map((e: any) => ({
        id: e.id || e.estudianteId,
        nombre: e.nombreCompleto || e.NombreCompleto || `${e.nombres ?? ''} ${e.apellidos ?? ''}`.trim(),
      }));
      this.studentsCache.set(courseId, mapped);
      return mapped;
    } catch {
      return [];
    }
  }

  getObservacionForStudent(studentId: string): string | null {
    return this.dateAttendance().find(a => a.estudianteId === studentId)?.observacion ?? null;
  }

  getStudentMinutosHoy(studentId: string): number {
    const acts = this.parseActividades(this.getObservacionForStudent(studentId));
    return acts.reduce((acc, a) => acc + (a.d || 0), 0);
  }

  getStudentStatusLabel(stat: AttendanceStats): { text: string; colorClass: string; bgClass: string; borderClass: string } {
    if (stat.progressPercent >= 100 || (stat.completedLessons > 0 && stat.completedLessons === stat.totalLessons)) {
      return { text: 'Completado', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200' };
    }
    if (stat.completedLessons > 0 || stat.progressPercent > 0 || this.getStudentMinutosHoy(stat.studentId) > 0) {
      return { text: 'En Progreso', colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200' };
    }
    return { text: 'Sin Iniciar', colorClass: 'text-slate-500', bgClass: 'bg-slate-100', borderClass: 'border-slate-200' };
  }

  formatLastActivity(lastActivityAt: string | null): string {
    if (!lastActivityAt) return 'Sin conexión';
    try {
      const date = new Date(lastActivityAt);
      if (isNaN(date.getTime())) return 'Sin conexión';
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - date.getTime());
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return 'En línea';
      if (diffMins < 60) return `Hace ${diffMins}m`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays}d`;
      return date.toLocaleDateString();
    } catch {
      return 'Sin conexión';
    }
  }

  parseActividades(observacion: string | null): ActividadItem[] {
    if (!observacion) return [];
    try {
      const doc = JSON.parse(observacion);
      if (doc.actividades && Array.isArray(doc.actividades)) {
        return doc.actividades as ActividadItem[];
      }
    } catch { }
    return [];
  }

  exportToCSV(): void {
    const stats = this.filteredStats();
    if (!stats.length) {
      this.notification.show('info', 'No hay registros para exportar.');
      return;
    }
    const headers = ['Estudiante', 'Estado Formativo', 'Avance Aula (%)', 'Lecciones Completadas', 'Lecciones Totales', 'Tiempo Hoy (min)', 'Última Conexión'];
    const rows = stats.map(s => {
      const status = this.getStudentStatusLabel(s).text;
      const minutos = this.getStudentMinutosHoy(s.studentId);
      const lastAct = this.formatLastActivity(s.lastActivityAt);
      return [
        `"${s.studentName}"`,
        `"${status}"`,
        `${s.progressPercent}%`,
        s.completedLessons,
        s.totalLessons,
        minutos,
        `"${lastAct}"`,
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progreso_lecciones_${this.selectedDate()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.notification.show('success', 'Reporte CSV de progreso descargado correctamente.');
  }

  openStudentDetail(stat: AttendanceStats): void {
    const observacion = this.getObservacionForStudent(stat.studentId);
    const actividades = this.parseActividades(observacion);
    const totalMinutos = actividades.reduce((acc, a) => acc + (a.d || 0), 0);

    this.selectedStudentDetail.set({
      studentId: stat.studentId,
      studentName: stat.studentName,
      actividades,
      porcentaje: stat.porcentaje,
      totalLecciones: stat.total,
      totalMinutos,
      progressPercent: stat.progressPercent,
      completedLessons: stat.completedLessons,
      totalLessons: stat.totalLessons,
      lastActivityAt: stat.lastActivityAt,
    });
  }

  closeStudentDetail(): void {
    this.selectedStudentDetail.set(null);
  }
}
