import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';
import { 
  AttendanceCourse, 
  AttendanceData, 
  Sesion, 
  ResumenEstudiante, 
  Asistencia 
} from '../../../domain/models/attendance.model';
import { AttendanceHeaderComponent } from './components/attendance-header/attendance-header.component';
import { AttendanceTableComponent } from './components/attendance-table/attendance-table.component';
import { SkeletonLoaderComponent } from '../../../../../shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [
    CommonModule, 
    AttendanceHeaderComponent, 
    AttendanceTableComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './attendance-management.component.html',
})
export class AttendanceManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);

  // State
  courses = signal<AttendanceCourse[]>([]);
  selectedCourseId = signal<string>('');
  attendanceData = signal<AttendanceData | null>(null);
  isLoading = signal(true);
  searchTerm = signal('');

  private docenteId = '';
  private studentsCache: { estudianteId: string; estudianteNombre: string }[] = [];

  // Data Selectors
  resumenEstudiantes = computed(() => this.attendanceData()?.resumenEstudiantes || []);

  filteredResumen = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const resumen = this.resumenEstudiantes();
    if (!term) return resumen;
    return resumen.filter((r: ResumenEstudiante) => r.estudianteNombre.toLowerCase().includes(term));
  });

  // Stats
  promedioAsistencia = computed(() => {
    const resumen = this.resumenEstudiantes();
    if (resumen.length === 0) return 0;
    return resumen.reduce((sum: number, r: ResumenEstudiante) => sum + r.porcentajeAsistencia, 0) / resumen.length;
  });

  totalPresentes = computed(() => this.resumenEstudiantes().reduce((sum: number, r: ResumenEstudiante) => sum + r.presentes, 0));
  totalAusentes = computed(() => this.resumenEstudiantes().reduce((sum: number, r: ResumenEstudiante) => sum + r.ausentes, 0));
  totalTardanzas = computed(() => this.resumenEstudiantes().reduce((sum: number, r: ResumenEstudiante) => sum + r.tardanzas, 0));

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
      this.courses.set(courses.map((c) => ({ id: c.id, codigo: c.codigo, titulo: c.titulo })));

      if (this.courses().length > 0) {
        this.selectedCourseId.set(this.courses()[0].id);
        this.buildAttendanceData();
      }
    } catch (err) {
      console.error('❌ Error loading teacher data:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCourseChange(): void {
    this.buildAttendanceData();
  }

  private buildAttendanceData(): void {
    const courseId = this.selectedCourseId();
    const course = this.courses().find((c) => c.id === courseId);
    if (!course) return;

    const data = this.generateMockAttendanceData(course);
    this.attendanceData.set(data);
  }

  private generateMockAttendanceData(course: AttendanceCourse): AttendanceData {
    const sesiones: Sesion[] = [];
    const today = new Date();

    for (let i = 0; i < 8; i++) {
      const sesionDate = new Date(today);
      sesionDate.setDate(today.getDate() - (7 - i) * 7);

      const asistencias: Asistencia[] = this.studentsCache.map((s, sIdx) => {
        const roll = (sIdx + i) % 10;
        let estado: 'Presente' | 'Ausente' | 'Tardanza';
        if (roll === 0) estado = 'Ausente';
        else if (roll === 1) estado = 'Tardanza';
        else estado = 'Presente';
        
        return { estudianteId: s.estudianteId, estado };
      });

      sesiones.push({
        id: `ses-${course.id.slice(0, 4)}-${i}`,
        fecha: sesionDate.toISOString(),
        tema: `Sesión ${i + 1}`,
        tipo: i % 2 === 0 ? 'Teórica' : 'Práctica',
        duracion: '2h',
        asistencias,
        porcentajeAsistencia: Math.round((asistencias.filter(a => a.estado !== 'Ausente').length / asistencias.length) * 100),
      });
    }

    const resumenEstudiantes: ResumenEstudiante[] = this.studentsCache.map((s) => {
      const studentAsistencias = sesiones.map(ses => ses.asistencias.find(a => a.estudianteId === s.estudianteId));
      const presentes = studentAsistencias.filter(a => a?.estado === 'Presente').length;
      const ausentes = studentAsistencias.filter(a => a?.estado === 'Ausente').length;
      const tardanzas = studentAsistencias.filter(a => a?.estado === 'Tardanza').length;
      
      return {
        estudianteId: s.estudianteId,
        estudianteNombre: s.estudianteNombre,
        totalSesiones: sesiones.length,
        presentes, ausentes, tardanzas,
        porcentajeAsistencia: Math.round(((presentes + tardanzas) / sesiones.length) * 100),
      };
    });

    return { courseId: course.id, courseName: course.titulo, courseCode: course.codigo, sesiones, resumenEstudiantes };
  }

  exportToCSV(): void {
    const data = this.attendanceData();
    const resumen = this.filteredResumen();
    if (!data || resumen.length === 0) return;

    const headers = ['Estudiante', 'Total Sesiones', 'Presentes', 'Ausentes', 'Tardanzas', 'Asistencia %'];
    const rows = resumen.map((r: ResumenEstudiante) => [
      `"${r.estudianteNombre}"`, r.totalSesiones, r.presentes, r.ausentes, r.tardanzas, r.porcentajeAsistencia + '%',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencia_${data.courseCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
