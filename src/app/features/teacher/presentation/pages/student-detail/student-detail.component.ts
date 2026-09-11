import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { NotificationService } from '@shared/services/notification.service';
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/ui/status-badge/status-badge.component';
import { environment } from '@environments/environment';

interface PromedioResponse {
  estudianteId: string;
  promedioGeneral: number;
  totalEvaluaciones: number;
  evaluacionesCompletadas: number;
  notaMasAlta: number | null;
  notaMasBaja: number | null;
}

interface EvaluacionItem {
  id: string;
  cursoId?: string;
  titulo: string;
  tipoEvaluacion: string;
  estado: string;
  puntajeMaximo: number;
  fechaFin: string;
}

export interface StudentCourseItem {
  id: string;
  codigo?: string;
  nombre: string;
}

interface StudentInfo {
  id: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  email: string;
  codigo: string;
  avatar: string;
  estado?: string;
  cursos: any[];
}

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './student-detail.component.html',
  styles: ``,
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);
  private notification = inject(NotificationService);

  studentId = signal('');
  studentInfo = signal<StudentInfo | null>(null);
  promedioData = signal<PromedioResponse | null>(null);
  evaluaciones = signal<EvaluacionItem[]>([]);
  courseNames = signal<Map<string, string>>(new Map());
  isLoading = signal(true);
  errorMsg = signal('');

  selectedCourseFilter = signal<string>('all');
  evaluationsSearch = signal<string>('');

  private docenteId = '';
  private userId = '';

  studentCourses = computed<StudentCourseItem[]>(() => {
    const info = this.studentInfo();
    if (!info) return [];
    const map = this.courseNames();
    return (info.cursos || []).map((c: any) => {
      if (typeof c === 'string') {
        return {
          id: c,
          nombre: map.get(c) || 'Curso Asignado',
          codigo: ''
        };
      }
      const id = c?.cursoId || c?.id || '';
      const nombre = c?.nombreCurso || c?.titulo || c?.nombre || map.get(id) || 'Curso Asignado';
      const codigo = c?.codigoCurso || c?.codigo || '';
      return { id, nombre, codigo };
    }).filter((c: StudentCourseItem) => !!c.id);
  });

  studentCourseNames = computed(() => {
    return this.studentCourses().map(c => c.nombre);
  });

  studentInitials = computed(() => {
    const info = this.studentInfo();
    if (!info) return 'E';
    const n = (info.nombre || '').trim().charAt(0);
    const a = (info.apellidos || '').trim().charAt(0);
    return (n + a).toUpperCase() || 'E';
  });

  promedioValue = computed(() => {
    return this.promedioData()?.promedioGeneral ?? 0;
  });

  promedioPorcentaje = computed(() => {
    const p = this.promedioValue();
    return Math.min(100, Math.max(0, Math.round((p / 20) * 100)));
  });

  promedioPerformanceLabel = computed(() => {
    const p = this.promedioValue();
    if (p >= 14) return { label: 'Rendimiento Destacado', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (p >= 11) return { label: 'Rendimiento Regular', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    if (p > 0) return { label: 'En Riesgo Académico', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { label: 'Sin Calificaciones', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
  });

  cumplimientoPorcentaje = computed(() => {
    const data = this.promedioData();
    if (!data || !data.totalEvaluaciones) return 0;
    return Math.min(100, Math.round((data.evaluacionesCompletadas / data.totalEvaluaciones) * 100));
  });

  filteredEvaluaciones = computed(() => {
    let list = this.evaluaciones();
    const course = this.selectedCourseFilter();
    const search = this.evaluationsSearch().toLowerCase().trim();

    if (course !== 'all') {
      list = list.filter(e => e.cursoId === course);
    }

    if (search) {
      list = list.filter(e =>
        e.titulo.toLowerCase().includes(search) ||
        e.tipoEvaluacion.toLowerCase().includes(search)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.userId = this.authRepo.getCurrentUser()?.id ?? '';
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.studentId.set(id);
    this.loadData(id);
  }

  async loadData(studentId: string): Promise<void> {
    if (!studentId) {
      this.errorMsg.set('No se encontró el ID del estudiante.');
      this.isLoading.set(false);
      return;
    }
    try {
      const teacherInfo = await this.teacherQuery.getTeacherInfo(this.userId);
      this.docenteId = teacherInfo.id;

      const [students, promedioResp, evalResp, courses] = await Promise.all([
        firstValueFrom(
          this.http.get<any[]>(`${environment.estudiantesApiUrl}/estudiantes/por-docente/${this.docenteId}`)
            .pipe(catchError(() => of([])))
        ),
        firstValueFrom(
          this.http.get<PromedioResponse>(`${environment.evaluacionesApiUrl}/evaluaciones/estudiante/${studentId}/promedio`)
            .pipe(catchError(() => of(null)))
        ),
        firstValueFrom(
          this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones?estudianteId=${studentId}`)
            .pipe(catchError(() => of(null)))
        ),
        this.teacherQuery.getTeacherCourses(this.userId),
      ]);

      // Map course IDs → names
      const courseMap = new Map<string, string>();
      courses.forEach((c) => courseMap.set(c.id, c.titulo));
      this.courseNames.set(courseMap);

      // Find student in the list
      const raw = (students ?? []).find(
        (s: any) => s.estudianteId === studentId || s.id === studentId,
      );
      if (raw) {
        const partes = (raw.nombreCompleto ?? '').trim().split(' ');
        const nombre = partes[0] ?? '';
        const apellidos = partes.slice(1).join(' ');
        this.studentInfo.set({
          id: studentId,
          nombre,
          apellidos,
          nombreCompleto: raw.nombreCompleto ?? '',
          email: raw.email ?? '',
          codigo:
            raw.codigoEstudiante ??
            (raw.usuarioId ?? studentId).substring(0, 8).toUpperCase(),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.nombreCompleto ?? 'E')}&background=0d9488&color=fff&size=128&bold=true`,
          cursos: raw.cursos ?? [],
        });
      } else {
        // Fallback: show partial info with id
        this.studentInfo.set({
          id: studentId,
          nombre: 'Estudiante',
          apellidos: '',
          nombreCompleto: 'Estudiante',
          email: '',
          codigo: studentId.substring(0, 8).toUpperCase(),
          avatar: `https://ui-avatars.com/api/?name=E&background=0d9488&color=fff&size=128&bold=true`,
          cursos: [],
        });
      }

      if (promedioResp) {
        this.promedioData.set(promedioResp);
      }

      const evals: any[] = evalResp?.evaluaciones ?? [];
      this.evaluaciones.set(
        evals.map((e: any) => ({
          id: e.id,
          titulo: e.titulo,
          tipoEvaluacion: e.tipoEvaluacion ?? e.tipo ?? 'Quizz',
          estado: e.estado ?? 'Pendiente',
          puntajeMaximo: e.puntajeMaximo ?? 0,
          fechaFin: e.fechaFin ?? e.fechaLimite ?? '',
        })),
      );
    } catch (err) {

      this.errorMsg.set('Error al cargar la información del estudiante.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/teacher/students']);
  }

  getEstadoColor(estado: string): string {
    const c: Record<string, string> = {
      Completado: 'bg-green-50 text-green-600 border border-green-200',
      Pendiente: 'bg-slate-100 text-slate-500 border border-slate-200',
      'En Calificación': 'bg-orange-50 text-orange-600 border border-orange-200',
      Activo: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
    };
    return c[estado] || 'bg-slate-100 text-slate-500 border border-slate-200';
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      '0': 'Tarea', '1': 'Examen', '2': 'Proyecto', '3': 'Laboratorio', '4': 'Quizz',
      Quizz: 'Quizz', Examen: 'Examen', Tarea: 'Tarea', Proyecto: 'Proyecto',
    };
    return labels[tipo] || tipo;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  copyCode(code: string): void {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.notification.show('success', 'Código copiado al portapapeles.');
    }).catch(() => {
      this.notification.show('info', `Código: ${code}`);
    });
  }
}
