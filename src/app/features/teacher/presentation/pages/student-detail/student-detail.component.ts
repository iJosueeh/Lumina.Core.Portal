import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
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
  titulo: string;
  tipoEvaluacion: string;
  estado: string;
  puntajeMaximo: number;
  fechaFin: string;
}

interface StudentInfo {
  id: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  email: string;
  codigo: string;
  avatar: string;
  cursos: string[];
}

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-detail.component.html',
  styles: ``,
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);

  studentId = signal('');
  studentInfo = signal<StudentInfo | null>(null);
  promedioData = signal<PromedioResponse | null>(null);
  evaluaciones = signal<EvaluacionItem[]>([]);
  courseNames = signal<Map<string, string>>(new Map());
  isLoading = signal(true);
  errorMsg = signal('');

  private docenteId = '';
  private userId = '';

  studentCourseNames = computed(() => {
    const info = this.studentInfo();
    if (!info) return [];
    const map = this.courseNames();
    return info.cursos.map((id) => map.get(id) ?? null).filter(Boolean) as string[];
  });

  promedioColor = computed(() => {
    const p = this.promedioData()?.promedioGeneral ?? 0;
    if (p >= 14) return 'text-green-400';
    if (p >= 10.5) return 'text-orange-400';
    return p > 0 ? 'text-red-400' : 'text-gray-400';
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
        this.http
          .get<any[]>(`${environment.estudiantesApiUrl}/estudiantes/por-docente/${this.docenteId}`)
          .toPromise()
          .catch(() => []),
        this.http
          .get<PromedioResponse>(
            `${environment.evaluacionesApiUrl}/evaluaciones/estudiante/${studentId}/promedio`,
          )
          .toPromise()
          .catch(() => null),
        this.http
          .get<any>(`${environment.evaluacionesApiUrl}/evaluaciones?estudianteId=${studentId}`)
          .toPromise()
          .catch(() => null),
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
      console.error('❌ [STUDENT-DETAIL] Error loading:', err);
      this.errorMsg.set('Error al cargar la información del estudiante.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    history.back();
  }

  getEstadoColor(estado: string): string {
    const c: Record<string, string> = {
      Completado: 'bg-green-900/30 text-green-400 border border-green-500/30',
      Pendiente: 'bg-gray-800/60 text-gray-400 border border-gray-600/30',
      'En Calificación': 'bg-orange-900/30 text-orange-400 border border-orange-500/30',
      Activo: 'bg-blue-900/30 text-blue-400 border border-blue-500/30',
    };
    return c[estado] || 'bg-gray-800/60 text-gray-400 border border-gray-600/30';
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
}
