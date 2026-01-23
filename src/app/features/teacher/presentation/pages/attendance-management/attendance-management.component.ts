import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  courses = signal<TeacherCourse[]>([]);
  selectedCourseId = signal<string>('');
  attendanceData = signal<AttendanceData | null>(null);
  selectedSesion = signal<Sesion | null>(null);
  isLoading = signal(true);
  searchTerm = signal('');

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').subscribe({
      next: (courses) => {
        const simplifiedCourses = courses.map((c) => ({
          id: c.id,
          codigo: c.codigo,
          titulo: c.titulo,
        }));
        this.courses.set(simplifiedCourses);

        if (courses.length > 0) {
          this.selectedCourseId.set(courses[0].id);
          this.loadAttendance();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ [ATTENDANCE] Error loading courses:', error);
        this.isLoading.set(false);
      },
    });
  }

  onCourseChange(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    const courseId = this.selectedCourseId();
    if (!courseId) return;

    this.isLoading.set(true);

    this.http.get<AttendanceData[]>('/assets/mock-data/teachers/attendance-records.json').subscribe({
      next: (data) => {
        const courseData = data.find((c) => c.courseId === courseId);
        if (courseData) {
          this.attendanceData.set(courseData);
          console.log('✅ [ATTENDANCE] Attendance loaded for course:', courseData.courseName);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ [ATTENDANCE] Error loading attendance:', error);
        this.isLoading.set(false);
      },
    });
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
    console.log('📊 [ATTENDANCE] Exporting to CSV...');
    alert('Exportación a CSV - Próximamente');
  }
}
