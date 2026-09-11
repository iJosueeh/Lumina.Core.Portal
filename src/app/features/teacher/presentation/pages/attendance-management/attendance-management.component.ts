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
}

export interface AttendanceCourse {
  id: string;
  codigo: string;
  titulo: string;
}

export interface StudentDetailModalData {
  studentId: string;
  studentName: string;
  estado: 'Activo' | 'Pendiente' | null;
  actividades: ActividadItem[];
  porcentaje: number;
  totalLecciones: number;
  totalMinutos: number;
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
  isSaving = signal(false);
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

  engagementRate = computed(() => {
    const stats = this.allStats();
    if (!stats.length) return 0;
    const activeToday = stats.filter(s => {
      const reg = this.dateAttendance().find(a => a.estudianteId === s.studentId);
      return reg?.estado === 'Activo';
    }).length;
    return Math.round((activeToday / stats.length) * 100);
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

  activeCountToday = computed(() => {
    return this.dateAttendance().filter(a => a.estado === 'Activo').length;
  });

  inactiveCountToday = computed(() => {
    const total = this.allStats().length;
    const active = this.activeCountToday();
    return Math.max(0, total - active);
  });

  averages = computed(() => {
    const stats = this.allStats();
    if (!stats.length) return { promedio: 0, activos: 0, pendientes: 0 };
    return {
      promedio: Math.round(stats.reduce((sum, s) => sum + s.porcentaje, 0) / stats.length),
      activos: stats.reduce((sum, s) => sum + s.activos, 0),
      pendientes: stats.reduce((sum, s) => sum + s.pendientes, 0),
    };
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
      this.notification.show('success', 'Telemetría actualizada correctamente.');
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

      // Parallelize student metric requests with Promise.all
      const statsPromises = students.map(async (student) => {
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
          };
        } catch {
          return {
            studentId: student.id,
            studentName: student.nombre,
            total: 0,
            activos: 0,
            pendientes: 0,
            porcentaje: 0,
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

  getEstadoForStudent(studentId: string): 'Activo' | 'Pendiente' {
    const reg = this.dateAttendance().find(a => a.estudianteId === studentId);
    return reg ? reg.estado : 'Pendiente';
  }

  getObservacionForStudent(studentId: string): string | null {
    return this.dateAttendance().find(a => a.estudianteId === studentId)?.observacion ?? null;
  }

  getStudentMinutosHoy(studentId: string): number {
    const acts = this.parseActividades(this.getObservacionForStudent(studentId));
    return acts.reduce((acc, a) => acc + (a.d || 0), 0);
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

  async onEstadoChange(studentId: string, estado: 'Activo' | 'Pendiente'): Promise<void> {
    const existing = this.dateAttendance().find(a => a.estudianteId === studentId);
    const courseId = this.selectedCourseId();
    const fecha = this.selectedDate();

    try {
      if (existing) {
        await firstValueFrom(
          this.http.put<any>(
            `${environment.estudiantesApiUrl}/asistencias/${existing.id}`,
            { asistenciaId: existing.id, estado, observacion: existing.observacion }
          )
        );
        this.dateAttendance.update(list =>
          list.map(a => a.estudianteId === studentId ? { ...a, estado } : a)
        );
      } else {
        const result = await firstValueFrom(
          this.http.post<any>(`${environment.estudiantesApiUrl}/asistencias`, {
            cursoId: courseId,
            docenteId: this.docenteId,
            fecha,
            registros: [{ estudianteId: studentId, estado, observacion: null }],
          })
        );
        const newId = (result as any)?.registros?.[0]?.id || (result as any)?.id || crypto.randomUUID();
        this.dateAttendance.update(list => [
          ...list,
          {
            id: newId,
            estudianteId: studentId,
            estado,
            observacion: null,
            fecha,
          }
        ]);
      }

      this.notification.show('success', `Estado actualizado a ${estado}.`);
      await this.loadAllStats();
    } catch {
      this.notification.show('error', 'Error al actualizar el estado.');
    }
  }

  exportToCSV(): void {
    const stats = this.filteredStats();
    if (!stats.length) {
      this.notification.show('info', 'No hay registros para exportar.');
      return;
    }
    const headers = ['Estudiante', 'Estado Hoy', 'Minutos Hoy', 'Actividades Hoy', 'Histórico (%)', 'Total Sesiones'];
    const rows = stats.map(s => {
      const estado = this.getEstadoForStudent(s.studentId);
      const minutos = this.getStudentMinutosHoy(s.studentId);
      const acts = this.parseActividades(this.getObservacionForStudent(s.studentId));
      const actsText = acts.map(a => `${a.t}: ${a.r}`).join('; ');
      return [
        `"${s.studentName}"`,
        `"${estado}"`,
        minutos,
        `"${actsText}"`,
        `${s.porcentaje}%`,
        s.total,
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `telemetria_aula_${this.selectedDate()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.notification.show('success', 'Reporte CSV de telemetría descargado correctamente.');
  }

  openStudentDetail(stat: AttendanceStats): void {
    const observacion = this.getObservacionForStudent(stat.studentId);
    const actividades = this.parseActividades(observacion);
    const estado = this.getEstadoForStudent(stat.studentId);
    const totalMinutos = actividades.reduce((acc, a) => acc + (a.d || 0), 0);

    this.selectedStudentDetail.set({
      studentId: stat.studentId,
      studentName: stat.studentName,
      estado,
      actividades,
      porcentaje: stat.porcentaje,
      totalLecciones: stat.total,
      totalMinutos,
    });
  }

  closeStudentDetail(): void {
    this.selectedStudentDetail.set(null);
  }
}
