import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';

interface ActividadItem {
  t: string;
  r: string;
  d?: number;
  h?: string;
}

interface AsistenciaRegistro {
  id: string;
  estudianteId: string;
  estado: 'Activo' | 'Pendiente';
  observacion: string | null;
  fecha: string;
}

interface AttendanceStats {
  studentId: string;
  studentName: string;
  total: number;
  activos: number;
  pendientes: number;
  porcentaje: number;
}

interface AttendanceCourse {
  id: string;
  codigo: string;
  titulo: string;
}

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-management.component.html',
})
export class AttendanceManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);

  // State
  courses = signal<AttendanceCourse[]>([]);
  selectedCourseId = signal<string>('');
  selectedDate = signal<string>(new Date().toISOString().slice(0, 10));
  isLoading = signal(false);
  isSaving = signal(false);
  saveSuccess = signal(false);
  searchTerm = signal('');

  // Live attendance
  dateAttendance = signal<AsistenciaRegistro[]>([]);
  allStats = signal<AttendanceStats[]>([]);

  // Private state
  private docenteId = '';
  private studentsCache = new Map<string, { id: string; nombre: string }[]>();

  filteredStats = computed(() => {
    const stats = this.allStats();
    const term = this.searchTerm().toLowerCase();
    if (!term) return stats;
    return stats.filter(s => s.studentName.toLowerCase().includes(term));
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

  async onCourseChange(): Promise<void> {
    this.dateAttendance.set([]);
    await this.loadAttendanceForDate();
    await this.loadAllStats();
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
        await this.loadAttendanceForDate();
        await this.loadAllStats();
      }
    } catch (err) {

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
    if (!courseId) return;

    try {
      const students = await this.getStudentsForCourse(courseId);
      const stats: AttendanceStats[] = [];

      for (const student of students) {
        try {
          const data = await firstValueFrom(
            this.http.get<any>(`${environment.estudiantesApiUrl}/asistencias/resumen?estudianteId=${student.id}&cursoId=${courseId}`)
          );
          stats.push({
            studentId: student.id,
            studentName: student.nombre,
            total: data.totalClases ?? 0,
            activos: data.presentes ?? 0, // "Presente" backend → "Activo" frontend
            pendientes: data.ausentes ?? 0, // "Ausente" backend → "Pendiente" frontend
            porcentaje: data.porcentajeAsistencia ?? 0,
          });
        } catch {
          // Student has no attendance records yet
        }
      }
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

  getEstadoForStudent(studentId: string): 'Activo' | 'Pendiente' | null {
    return this.dateAttendance().find(a => a.estudianteId === studentId)?.estado ?? null;
  }

  getObservacionForStudent(studentId: string): string | null {
    return this.dateAttendance().find(a => a.estudianteId === studentId)?.observacion ?? null;
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
          fecha: this.selectedDate(),
          registros: [{ estudianteId: studentId, estado, observacion: null }],
        })
      );
      const updated = [...this.dateAttendance()];
      updated.push({
        id: (result as any).registros?.[0]?.id || crypto.randomUUID(),
        estudianteId: studentId,
        estado,
        observacion: null,
        fecha: this.selectedDate(),
      });
      this.dateAttendance.set(updated);
    }

    await this.loadAllStats();

    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  async onSaveAll(): Promise<void> {
    const courseId = this.selectedCourseId();
    const fecha = this.selectedDate();
    if (!courseId) return;

    const students = await this.getStudentsForCourse(courseId);
    const registros = students.map(s => {
      const existing = this.dateAttendance().find(a => a.estudianteId === s.id);
      return {
        estudianteId: s.id,
        estado: existing?.estado || 'Pendiente',
        observacion: existing?.observacion || null,
      };
    });

    this.isSaving.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${environment.estudiantesApiUrl}/asistencias`, {
          cursoId: courseId, docenteId: this.docenteId, fecha, registros,
        })
      );
      await this.loadAttendanceForDate();
      await this.loadAllStats();
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } catch (err) {

    } finally {
      this.isSaving.set(false);
    }
  }

  exportToCSV(): void {
    const stats = this.filteredStats();
    if (!stats.length) return;
    const headers = ['Estudiante', 'Total', 'Activos', 'Pendientes', '%'];
    const rows = stats.map(s => [`"${s.studentName}"`, s.total, s.activos, s.pendientes, s.porcentaje + '%']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencia_${this.selectedDate()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
