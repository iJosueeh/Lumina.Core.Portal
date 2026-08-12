import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { environment } from '@environments/environment';

interface AsistenciaRegistro {
  id: string;
  estudianteId: string;
  estado: 'Presente' | 'Ausente' | 'Tardanza';
  observacion: string | null;
  fecha: string;
}

interface AttendanceStats {
  studentId: string;
  studentName: string;
  total: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
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

  // State
  courses = signal<AttendanceCourse[]>([]);
  selectedCourseId = signal<string>('');
  selectedDate = signal<string>(new Date().toISOString().slice(0, 10));
  isLoading = signal(false);
  isSaving = signal(false);
  saveSuccess = signal(false);

  // Live attendance state
  dateAttendance = signal<AsistenciaRegistro[]>([]);
  allStats = signal<AttendanceStats[]>([]);

  // Optimized: single source of truth for students loaded per course
  private studentsCache = new Map<string, { id: string; nombre: string }[]>();

  filteredStats = computed(() => {
    const stats = this.allStats();
    const term = this.searchTerm().toLowerCase();
    if (!term) return stats;
    return stats.filter(s => s.studentName.toLowerCase().includes(term));
  });

  searchTerm = signal('');

  averages = computed(() => {
    const stats = this.allStats();
    if (!stats.length) return { promedio: 0, presentes: 0, tardanzas: 0, ausentes: 0 };
    return {
      promedio: Math.round(stats.reduce((sum, s) => sum + s.porcentaje, 0) / stats.length),
      presentes: stats.reduce((sum, s) => sum + s.presentes, 0),
      tardanzas: stats.reduce((sum, s) => sum + s.tardanzas, 0),
      ausentes: stats.reduce((sum, s) => sum + s.ausentes, 0),
    };
  });

  async ngOnInit(): Promise<void> {
    await this.loadCourses();
  }

  private async loadCourses(): Promise<void> {
    try {
      const user = this.authRepo.getCurrentUser();
      const userId = user?.id || (user as any)?.sub || '';

      const courses = await firstValueFrom(
        this.http.get<any[]>(`${environment.docentesApiUrl}/docentes/${userId}/cursos`)
      );
      this.courses.set(courses.map((c: any) => ({
        id: c.id || c.cursoId,
        codigo: c.codigo || c.courseCode || '',
        titulo: c.titulo || c.nombre || c.courseName || '',
      })));

      if (this.courses().length > 0) {
        this.selectedCourseId.set(this.courses()[0].id);
        await this.loadAttendanceForDate();
        await this.loadAllStats();
      }
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  }

  async onCourseChange(): Promise<void> {
    this.dateAttendance.set([]);
    await this.loadAttendanceForDate();
    await this.loadAllStats();
  }

  async onDateChange(): Promise<void> {
    await this.loadAttendanceForDate();
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
        estado: r.estado as 'Presente' | 'Ausente' | 'Tardanza',
        observacion: r.observacion || null,
        fecha: r.fecha,
      }));
      this.dateAttendance.set(records);
    } catch (err) {
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
        const data = await firstValueFrom(
          this.http.get<any>(`${environment.estudiantesApiUrl}/asistencias/resumen?estudianteId=${student.id}&cursoId=${courseId}`)
        );
        stats.push({
          studentId: student.id,
          studentName: student.nombre,
          total: data.totalClases ?? 0,
          presentes: data.presentes ?? 0,
          ausentes: data.ausentes ?? 0,
          tardanzas: data.tardanzas ?? 0,
          porcentaje: data.porcentajeAsistencia ?? 0,
        });
      }
      this.allStats.set(stats);
    } catch (err) {
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
        nombre: e.nombre || `${e.nombres ?? ''} ${e.apellidos ?? ''}`.trim(),
      }));
      this.studentsCache.set(courseId, mapped);
      return mapped;
    } catch {
      return [];
    }
  }

  getEstadoForStudent(studentId: string): 'Presente' | 'Ausente' | 'Tardanza' | null {
    return this.dateAttendance().find(a => a.estudianteId === studentId)?.estado ?? null;
  }

  async onEstadoChange(studentId: string, estado: 'Presente' | 'Ausente' | 'Tardanza'): Promise<void> {
    const existing = this.dateAttendance().find(a => a.estudianteId === studentId);
    const courseId = this.selectedCourseId();
    const user = this.authRepo.getCurrentUser();
    const docenteId = user?.id || (user as any)?.sub || '';

    if (existing) {
      // Update existing
      const result = await firstValueFrom(
        this.http.put<any>(
          `${environment.estudiantesApiUrl}/asistencias/${existing.id}`,
          { asistenciaId: existing.id, estado, observacion: existing.observacion }
        )
      );
      this.dateAttendance.update(list =>
        list.map(a => a.estudianteId === studentId ? { ...a, estado } : a)
      );
    } else {
      // Create new
      const result = await firstValueFrom(
        this.http.post<any>(`${environment.estudiantesApiUrl}/asistencias`, {
          cursoId: courseId,
          docenteId,
          fecha: this.selectedDate(),
          registros: [{ estudianteId: studentId, estado, observacion: null }],
        })
      );
      const updated = [...this.dateAttendance()];
      const reg = (result as any).registros?.[0];
      if (reg) {
        updated.push({
          id: (result as any).id || crypto.randomUUID(),
          estudianteId: studentId,
          estado,
          observacion: null,
          fecha: this.selectedDate(),
        });
      }
      this.dateAttendance.set(updated);
    }

    // Refresh stats
    await this.loadAllStats();

    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  async onSaveAll(): Promise<void> {
    const courseId = this.selectedCourseId();
    const user = this.authRepo.getCurrentUser();
    const docenteId = user?.id || (user as any)?.sub || '';
    const fecha = this.selectedDate();
    if (!courseId) return;

    const students = await this.getStudentsForCourse(courseId);
    const registros = students.map(s => {
      const existing = this.dateAttendance().find(a => a.estudianteId === s.id);
      return {
        estudianteId: s.id,
        estado: existing?.estado || 'Ausente',
        observacion: existing?.observacion || null,
      };
    });

    this.isSaving.set(true);
    try {
      const result = await firstValueFrom(
        this.http.post<any>(`${environment.estudiantesApiUrl}/asistencias`, {
          cursoId: courseId, docenteId, fecha, registros,
        })
      );
      await this.loadAttendanceForDate();
      await this.loadAllStats();
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  exportToCSV(): void {
    const stats = this.filteredStats();
    if (!stats.length) return;
    const headers = ['Estudiante', 'Total', 'Presentes', 'Tardanzas', 'Ausentes', '%'];
    const rows = stats.map(s => [`"${s.studentName}"`, s.total, s.presentes, s.tardanzas, s.ausentes, s.porcentaje + '%']);
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
