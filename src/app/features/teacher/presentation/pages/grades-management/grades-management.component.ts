import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';

interface Evaluacion {
  id: string;
  nombre: string;
  peso: number;
  tipo: string;
}

interface CalificacionEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  estudianteCodigo: string;
  notas: { [key: string]: number | null };
  promedio: number;
  estado: string;
}

interface CourseGradesData {
  courseId: string;
  courseName: string;
  courseCode: string;
  evaluaciones: Evaluacion[];
  calificaciones: CalificacionEstudiante[];
  estadisticas: {
    promedioGeneral: number;
    notaMasAlta: number;
    notaMasBaja: number;
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    totalEstudiantes: number;
  };
}

interface TeacherCourse {
  id: string;
  codigo: string;
  titulo: string;
}

@Component({
  selector: 'app-grades-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './grades-management.component.html',
  styles: ``,
})
export class GradesManagementComponent implements OnInit {
  protected readonly Math = Math;

  courses = signal<TeacherCourse[]>([]);
  selectedCourseId = signal<string>('');
  courseGradesData = signal<CourseGradesData | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  searchTerm = signal('');
  hasUnsavedChanges = signal(false);
  showCreateModal = signal(false);
  evaluationForm!: FormGroup;
  showNotificationModal = signal(false);
  notificationMessage = signal('');
  notificationType = signal<'success' | 'info' | 'warning' | 'error'>('success');

  // Computed values
  evaluaciones = computed(() => this.courseGradesData()?.evaluaciones || []);
  calificaciones = computed(() => this.courseGradesData()?.calificaciones || []);
  estadisticas = computed(() => this.courseGradesData()?.estadisticas || null);

  filteredCalificaciones = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const califs = this.calificaciones();

    if (!term) return califs;

    return califs.filter(
      (c) =>
        c.estudianteNombre.toLowerCase().includes(term) ||
        c.estudianteCodigo.toLowerCase().includes(term),
    );
  });

  private docenteId = '';
  private userId = '';

  constructor(
    private http: HttpClient,
    private authRepository: AuthRepository,
    private teacherQueryService: TeacherQueryService,
    private fb: FormBuilder,
  ) {
    this.userId = this.authRepository.getCurrentUser()?.id ?? '';
    this.initEvaluationForm();
  }

  ngOnInit(): void {
    this.loadTeacherData();
  }

  async loadTeacherData(): Promise<void> {
    try {
      const info = await this.teacherQueryService.getTeacherInfo(this.userId);
      this.docenteId = info.id;
      await this.loadCourses();
    } catch (e) {
      console.error('❌ [GRADES] Error loading teacher data:', e);
      this.isLoading.set(false);
    }
  }

  async loadCourses(): Promise<void> {
    try {
      const courses = await this.teacherQueryService.getTeacherCourses(this.userId);
      this.courses.set(courses.map((c) => ({ id: c.id, codigo: c.codigo, titulo: c.titulo })));
      if (courses.length > 0) {
        this.selectedCourseId.set(courses[0].id);
        this.loadGrades();
      } else {
        this.isLoading.set(false);
      }
    } catch (e) {
      console.error('❌ [GRADES] Error loading courses:', e);
      this.isLoading.set(false);
    }
  }

  onCourseChange(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    const courseId = this.selectedCourseId();
    if (!courseId || !this.docenteId) return;

    this.isLoading.set(true);

    forkJoin({
      evalResp: this.http.get<{ evaluaciones: any[] }>(
        `${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${courseId}`
      ),
      estudiantes: this.http.get<any[]>(
        `${environment.estudiantesApiUrl}/estudiantes/por-docente/${this.docenteId}`
      ),
    }).subscribe({
      next: ({ evalResp, estudiantes }) => {
        const evals: any[] = evalResp.evaluaciones ?? [];

        // Calcular peso proporcional al puntajeMaximo
        const totalPeso = evals.reduce((s, e) => s + (Number(e.puntajeMaximo) || 0), 0) || 100;
        const mappedEvals: Evaluacion[] = evals.map((e) => ({
          id: e.id,
          nombre: e.titulo,
          peso: Math.round((Number(e.puntajeMaximo) / totalPeso) * 100),
          tipo: e.tipo,
        }));

        // Notas vacías indexadas por evaluacionId
        const notasVacias: { [key: string]: number | null } = {};
        mappedEvals.forEach((e) => (notasVacias[e.id] = null));

        const califs: CalificacionEstudiante[] = estudiantes.map((s: any) => ({
          estudianteId: s.estudianteId ?? s.id ?? '',
          estudianteNombre: s.nombreCompleto ?? '',
          estudianteCodigo:
            s.codigoEstudiante ??
            (s.usuarioId ?? '').substring(0, 8).toUpperCase(),
          notas: { ...notasVacias },
          promedio: 0,
          estado: 'Pendiente',
        }));

        const course = this.courses().find((c) => c.id === courseId);
        this.courseGradesData.set({
          courseId,
          courseName: course?.titulo ?? '',
          courseCode: course?.codigo ?? '',
          evaluaciones: mappedEvals,
          calificaciones: califs,
          estadisticas: {
            promedioGeneral: 0,
            notaMasAlta: 0,
            notaMasBaja: 0,
            aprobados: 0,
            reprobados: 0,
            enRiesgo: 0,
            totalEstudiantes: califs.length,
          },
        });
        this.isLoading.set(false);
        console.log(`✅ [GRADES] ${mappedEvals.length} evaluaciones y ${califs.length} estudiantes cargados.`);
      },
      error: (error) => {
        console.error('❌ [GRADES] Error loading grades:', error);
        this.isLoading.set(false);
      },
    });
  }

  onGradeChange(estudianteId: string, evaluacionId: string, value: string): void {
    const califs = this.calificaciones();
    const estudiante = califs.find((c) => c.estudianteId === estudianteId);

    if (estudiante) {
      const numValue = value === '' ? null : parseFloat(value);
      estudiante.notas[evaluacionId] = numValue;
      this.hasUnsavedChanges.set(true);
      this.calculateStudentAverage(estudiante);
    }
  }

  calculateStudentAverage(estudiante: CalificacionEstudiante): void {
    const evaluaciones = this.evaluaciones();
    let totalWeighted = 0;
    let totalWeight = 0;

    evaluaciones.forEach((evaluation) => {
      const nota = estudiante.notas[evaluation.id];
      if (nota !== null && nota !== undefined) {
        totalWeighted += nota * (evaluation.peso / 100);
        totalWeight += evaluation.peso / 100;
      }
    });

    estudiante.promedio = totalWeight > 0 ? totalWeighted / totalWeight : 0;

    // Actualizar estado
    if (estudiante.promedio >= 14) {
      estudiante.estado = 'Aprobado';
    } else if (estudiante.promedio >= 10.5) {
      estudiante.estado = 'En Riesgo';
    } else {
      estudiante.estado = 'Reprobado';
    }
  }

  saveChanges(): void {
    if (!this.hasUnsavedChanges() || this.isSaving()) return;

    const evals = this.evaluaciones();
    const califs = this.calificaciones();
    if (evals.length === 0 || califs.length === 0) return;

    this.isSaving.set(true);

    // Build one request per evaluación that has at least one grade
    const requests = evals
      .map((ev) => {
        const entradas = califs
          .filter((c) => c.notas[ev.id] !== null && c.notas[ev.id] !== undefined)
          .map((c) => ({ estudianteId: c.estudianteId, nota: c.notas[ev.id] as number }));

        if (entradas.length === 0) return null;
        return this.http
          .post(
            `${environment.evaluacionesApiUrl}/evaluaciones/${ev.id}/calificaciones`,
            entradas,
          )
          .toPromise();
      })
      .filter((r) => r !== null) as Promise<unknown>[];

    if (requests.length === 0) {
      this.isSaving.set(false);
      return;
    }

    Promise.all(requests)
      .then(() => {
        this.hasUnsavedChanges.set(false);
        this.showNotification('success', `Calificaciones guardadas exitosamente`);
      })
      .catch((err) => {
        console.error('❌ [GRADES] Error saving grades:', err);
        this.showNotification('error', 'Error al guardar calificaciones. Intente nuevamente.');
      })
      .finally(() => this.isSaving.set(false));
  }

  exportToCSV(): void {
    const evals = this.evaluaciones();
    const califs = this.calificaciones();
    const course = this.courseGradesData();
    if (!course || califs.length === 0) return;

    const headers = ['Estudiante', 'Código', ...evals.map((e) => e.nombre), 'Promedio', 'Estado'];
    const rows = califs.map((c) => [
      `"${c.estudianteNombre}"`,
      c.estudianteCodigo,
      ...evals.map((e) => (c.notas[e.id] ?? '')),
      c.promedio > 0 ? c.promedio.toFixed(2) : '',
      c.estado,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calificaciones_${course.courseCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      Aprobado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Reprobado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  getGradeColor(grade: number | null): string {
    if (grade === null || grade === undefined) return 'text-gray-400';
    if (grade >= 14) return 'text-green-600 dark:text-green-400 font-semibold';
    if (grade >= 10.5) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
  }

  getInputBorderColor(grade: number | null): string {
    if (grade === null || grade === undefined) return 'border-gray-600';
    if (grade >= 14) return 'border-green-500';
    if (grade >= 10.5) return 'border-orange-500';
    return 'border-red-500';
  }

  initEvaluationForm(): void {
    this.evaluationForm = this.fb.group({
      cursoId: ['', [Validators.required]],
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      tipo: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      duracionMinutos: [60, [Validators.required, Validators.min(1)]],
      peso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      puntajeMaximo: [20, [Validators.required, Validators.min(1)]],
      intentosMaximos: [1, [Validators.required, Validators.min(1)]],
    });
  }

  openCreateModal(): void {
    // Si hay un curso seleccionado, prellenar el campo
    const selectedId = this.selectedCourseId();
    if (selectedId) {
      this.evaluationForm.patchValue({ cursoId: selectedId });
    }
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.evaluationForm.reset({
      duracionMinutos: 60,
      peso: 0,
      puntajeMaximo: 20,
      intentosMaximos: 1,
    });
  }

  onSubmitEvaluation(): void {
    if (this.evaluationForm.invalid) {
      Object.keys(this.evaluationForm.controls).forEach((key) => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.evaluationForm.value;
    const evaluationData = {
      ...formValue,
      fechaInicio: new Date(formValue.fechaInicio).toISOString(),
      fechaFin: new Date(formValue.fechaFin).toISOString(),
      preguntas: [],
      configuracion: {
        mostrarResultadoInmediato: false,
        permitirRevision: false,
        ordenAleatorio: false,
        mostrarUnaVez: false,
        requiereWebcam: false,
      },
    };

    this.http.post(`${environment.evaluacionesApiUrl}/evaluaciones`, evaluationData).subscribe({
      next: () => {
        this.closeCreateModal();
        this.showNotification('success', 'Evaluación creada exitosamente');
        this.loadGrades();
      },
      error: (err) => {
        console.error('❌ [GRADES] Error creating evaluation:', err);
        this.showNotification('error', 'Error al crear la evaluación. Intente nuevamente.');
      },
    });
  }

  showNotification(type: 'success' | 'info' | 'warning' | 'error', message: string): void {
    this.notificationType.set(type);
    this.notificationMessage.set(message);
    this.showNotificationModal.set(true);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
      this.closeNotificationModal();
    }, 3000);
  }

  closeNotificationModal(): void {
    this.showNotificationModal.set(false);
  }
}

