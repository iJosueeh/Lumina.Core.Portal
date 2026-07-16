import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { TeacherGradesService } from '@features/teacher/infrastructure/services/teacher-grades.service';
import { NotificationService } from '@shared/services/notification.service';
import { environment } from '@environments/environment';

// Models & Mappers
import { EvaluacionUI } from '@features/teacher/domain/models/evaluation.model';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { EvaluationMapper } from '../../../infrastructure/mappers/evaluation.mapper';

// Shared Components
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { EvaluationFilterComponent } from './components/evaluation-filter/evaluation-filter.component';
import { EvaluationModalComponent } from '../grades-management/components/evaluation-modal/evaluation-modal.component';

@Component({
  selector: 'app-evaluations-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    EvaluationFilterComponent,
    EvaluationModalComponent
  ],
  templateUrl: './evaluations-list.component.html',
})
export class EvaluationsListComponent implements OnInit {
  private http = inject(HttpClient);
  private authRepository = inject(AuthRepository);
  private teacherQueryService = inject(TeacherQueryService);
  private gradesService = inject(TeacherGradesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private mapper = inject(EvaluationMapper);
  private fb = inject(FormBuilder);

  courses = signal<TeacherCourse[]>([]);
  evaluaciones = signal<EvaluacionUI[]>([]);
  selectedCourseId = signal<string>('all');
  searchTerm = signal('');
  isLoading = signal(true);
  showModal = signal(false);
  showDeleteModal = signal(false);
  isSaving = signal(false);
  docenteId = signal('');
  evaluacionToDelete = signal<{ id: string; titulo: string } | null>(null);
  evaluationForm!: FormGroup;

  private userId = this.authRepository.getCurrentUser()?.id ?? '';

  filteredEvaluaciones = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const courseId = this.selectedCourseId();
    let evaluations = this.evaluaciones();

    if (courseId !== 'all') {
      evaluations = evaluations.filter((e) => e.cursoId === courseId);
    }

    if (term) {
      evaluations = evaluations.filter(
        (e) =>
          e.titulo.toLowerCase().includes(term) ||
          e.descripcion?.toLowerCase().includes(term) ||
          e.cursoNombre?.toLowerCase().includes(term),
      );
    }

    return evaluations;
  });

  ngOnInit(): void {
    this.evaluationForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      tipo: ['Examen', Validators.required],
      peso: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      fechaFin: ['', Validators.required]
    });
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.teacherQueryService.getTeacherInfo(this.userId).then((teacher: any) => {
      if (teacher?.id) {
        this.docenteId.set(teacher.id);
        this.teacherQueryService.getTeacherCourses(teacher.usuarioId).then((courses: TeacherCourse[]) => {
          this.courses.set(courses);
          this.loadAllEvaluations(courses);
        }).catch(() => this.isLoading.set(false));
      }
    }).catch(() => this.isLoading.set(false));
  }

  loadAllEvaluations(courses: TeacherCourse[]): void {
    if (courses.length === 0) {
      this.isLoading.set(false);
      return;
    }

    const requests = courses.map((course) => {
      const url = `${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${course.id}`;
      console.log('🔍 [EVALUACIONES] Request URL:', url, 'course.id:', course.id, 'type:', typeof course.id);
      return this.http.get<{ mensaje: string; evaluaciones: any[] }>(url);
    });

    forkJoin(requests).subscribe({
      next: (responses) => {
        const all: EvaluacionUI[] = [];
        responses.forEach((response, index) => {
          const course = courses[index];
          (response.evaluaciones || []).forEach((ev: any) => {
            all.push({
              ...ev,
              peso: ev.puntajeMaximo || ev.peso || 0,
              tipoEvaluacion: this.mapper.mapTipoEnum(ev.tipoEvaluacion),
              estado: this.mapper.mapEstadoEnum(ev.estado),
              cursoId: course.id,
              cursoNombre: `${course.codigo} - ${course.titulo}`,
            });
          });
        });
        this.evaluaciones.set(all);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ [EVALUACIONES] Error loading evaluations:', err.status, err.statusText, err.error);
        this.isLoading.set(false);
      },
    });
  }

  viewDetails(evaluacionId: string, cursoId: string): void {
    this.router.navigate(['/teacher/grades'], { queryParams: { evaluacionId, cursoId } });
  }

  deleteEvaluation(data: { id: string, titulo: string, event: Event }): void {
    data.event.stopPropagation();
    this.evaluacionToDelete.set({ id: data.id, titulo: data.titulo });
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const evalToDelete = this.evaluacionToDelete();
    if (!evalToDelete) return;

    this.http.delete(`${environment.evaluacionesApiUrl}/evaluaciones/${evalToDelete.id}`).subscribe({
      next: () => {
        this.notificationService.show('success', `Evaluación "${evalToDelete.titulo}" eliminada`);
        this.showDeleteModal.set(false);
        this.evaluacionToDelete.set(null);
        this.loadAllEvaluations(this.courses());
      },
      error: () => {
        this.notificationService.show('error', 'Error al eliminar la evaluación');
        this.showDeleteModal.set(false);
        this.evaluacionToDelete.set(null);
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.evaluacionToDelete.set(null);
  }

  openEvaluationModal(): void {
    this.evaluationForm.reset({ peso: 10 });
    this.showModal.set(true);
  }

  private readonly TIPO_MAP: Record<string, number> = {
    Examen: 1,
    Tarea: 2,
    Proyecto: 3,
    Quizz: 4
  };

  saveEvaluation(): void {
    if (this.evaluationForm.invalid) return;
    const formVal = this.evaluationForm.value;

    const targetCourseId = this.selectedCourseId() === 'all'
      ? this.courses()[0]?.id
      : this.selectedCourseId();

    if (!targetCourseId) {
      this.notificationService.show('error', 'Selecciona un curso primero');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      cursoId: targetCourseId,
      docenteId: this.docenteId(),
      titulo: formVal.titulo,
      descripcion: formVal.descripcion || '',
      peso: formVal.peso,
      tipo: this.TIPO_MAP[formVal.tipo] ?? 2,
      fechaFin: new Date(formVal.fechaFin)
    };
    console.log('🔍 [EVALUACIONES] crearEvaluacion payload:', JSON.stringify(payload));
    this.gradesService.crearEvaluacion(payload).subscribe({
      next: () => {
        this.notificationService.show('success', `Evaluación "${formVal.titulo}" creada correctamente`);
        this.showModal.set(false);
        this.evaluationForm.reset({ peso: 10, tipo: 'Examen' });
        this.isSaving.set(false);
        this.loadAllEvaluations(this.courses());
      },
      error: (err) => {
        console.error('❌ [EVALUACIONES] Error al crear evaluación:', err.status, JSON.stringify(err.error, null, 2));
        this.isSaving.set(false);
        const msg = err.error?.errors 
          ? Object.entries(err.error.errors).map(([k, v]) => `${k}: ${v}`).join(', ')
          : err.error?.mensaje || 'Error desconocido';
        this.notificationService.show('error', `Error: ${msg}`);
      }
    });
  }
}
