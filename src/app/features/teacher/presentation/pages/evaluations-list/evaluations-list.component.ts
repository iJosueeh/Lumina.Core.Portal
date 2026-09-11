import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { NotificationService } from '@shared/services/notification.service';
import { environment } from '@environments/environment';

import { EvaluacionUI } from '@features/teacher/domain/models/evaluation.model';
import { EvaluacionApi } from '@shared/models/course-management.models';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { EvaluationMapper } from '../../../infrastructure/mappers/evaluation.mapper';

import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { StatCardComponent } from '@shared/components/ui/stat-card/stat-card.component';
import { EvaluationFilterComponent } from './components/evaluation-filter/evaluation-filter.component';
import { EvaluationCardComponent } from './components/evaluation-card/evaluation-card.component';
import { EvaluacionModalComponent } from '@shared/components/modals/evaluacion-modal/evaluacion-modal.component';
import { QuestionEditorComponent } from '../course-management/components/question-editor/question-editor.component';

@Component({
  selector: 'app-evaluations-list',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    StatCardComponent,
    EvaluationFilterComponent,
    EvaluationCardComponent,
    EvaluacionModalComponent,
    QuestionEditorComponent,
  ],
  templateUrl: './evaluations-list.component.html',
})
export class EvaluationsListComponent implements OnInit {
  private http = inject(HttpClient);
  private authRepository = inject(AuthRepository);
  private teacherQueryService = inject(TeacherQueryService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private mapper = inject(EvaluationMapper);

  courses = signal<TeacherCourse[]>([]);
  evaluaciones = signal<EvaluacionUI[]>([]);
  selectedCourseId = signal<string>('all');
  searchTerm = signal('');
  isLoading = signal(true);

  // Create modal
  showCreateModal = signal(false);
  selectedCourseIdForCreate = signal('');

  // Edit modal
  showEditModal = signal(false);
  selectedEvalToEdit = signal<EvaluacionApi | null>(null);
  selectedCourseIdForEval = signal('');

  // Question editor
  showQuestionEditor = signal(false);
  selectedEvalForQuestions = signal<{ id: string; titulo: string; puntajeMaximo: number } | null>(null);

  // Delete
  showDeleteModal = signal(false);
  evaluacionToDelete = signal<{ id: string; titulo: string } | null>(null);

  private getUserId(): string {
    const user = this.authRepository.getCurrentUser();
    return user?.id || (user as any)?.sub || '';
  }

  totalEvaluaciones = computed(() => this.evaluaciones().length);
  publicadasCount = computed(() => this.evaluaciones().filter((e) => e.estado === 'Publicada').length);
  pendientesCount = computed(() => this.evaluaciones().filter((e) => e.estado === 'Pendiente' || e.estado === 'Borrador').length);
  cursosConEvaluaciones = computed(() => new Set(this.evaluaciones().map((e) => e.cursoId)).size);

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
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    const userId = this.getUserId();

    this.teacherQueryService.getTeacherCourses(userId).then((courses: TeacherCourse[]) => {
      this.courses.set(courses);
      this.loadAllEvaluations(courses);
    }).catch(() => this.isLoading.set(false));
  }

  loadAllEvaluations(courses: TeacherCourse[]): void {
    if (courses.length === 0) {
      this.isLoading.set(false);
      return;
    }

    const requests = courses.map((course) =>
      this.http.get<{ mensaje: string; evaluaciones: any[] }>(
        `${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${course.id}`
      )
    );

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
      error: () => this.isLoading.set(false),
    });
  }

  // ─── Create Evaluation ──────────────────────────────────
  async openCreateModal(): Promise<void> {
    let courseList = this.courses();
    if (courseList.length === 0) {
      const userId = this.getUserId();
      if (userId) {
        try {
          courseList = await this.teacherQueryService.getTeacherCourses(userId);
          this.courses.set(courseList);
        } catch {}
      }
    }

    const currentFilter = this.selectedCourseId();
    const defaultCourseId = (currentFilter && currentFilter !== 'all')
      ? currentFilter
      : (courseList[0]?.id || '035fc56e-2450-e046-b996-06c97747b6ea');

    this.selectedCourseIdForCreate.set(defaultCourseId);
    this.showCreateModal.set(true);
  }

  onCreateSaved(data: { id: string; titulo: string }): void {
    this.showCreateModal.set(false);
    this.selectedCourseIdForCreate.set('');
    this.loadAllEvaluations(this.courses());
    this.openQuestionEditor(data.id, { titulo: data.titulo });
  }

  // ─── Edit Evaluation ───────────────────────────────────
  openEditModal(evalId: string): void {
    const ev = this.evaluaciones().find((e) => e.id === evalId);
    if (!ev) return;

    this.selectedEvalToEdit.set({
      id: ev.id,
      titulo: ev.titulo,
      tipoEvaluacion: ev.tipoEvaluacion,
      fechaInicio: ev.fechaInicio,
      fechaFin: ev.fechaFin,
      estado: ev.estado,
      totalPreguntas: 0,
      puntajeMaximo: ev.puntajeMaximo,
    });
    this.selectedCourseIdForEval.set(ev.cursoId);
    this.showEditModal.set(true);
  }

  onEditSaved(): void {
    this.showEditModal.set(false);
    this.selectedEvalToEdit.set(null);
    this.loadAllEvaluations(this.courses());
  }

  // ─── Question Editor ───────────────────────────────────
  openQuestionEditor(evalId: string, fallbackData?: { titulo?: string; puntajeMaximo?: number }): void {
    const ev = this.evaluaciones().find((e) => e.id === evalId);
    const titulo = ev?.titulo || fallbackData?.titulo || 'Evaluación';
    const puntajeMaximo = ev?.puntajeMaximo || fallbackData?.puntajeMaximo || 100;
    this.selectedEvalForQuestions.set({ id: evalId, titulo, puntajeMaximo });
    this.showQuestionEditor.set(true);
  }

  onQuestionsSaved(): void {
    this.showQuestionEditor.set(false);
    this.selectedEvalForQuestions.set(null);
    this.loadAllEvaluations(this.courses());
  }

  // ─── Delete ────────────────────────────────────────────
  deleteEvaluation(data: { id: string; event: Event }): void {
    data.event.stopPropagation();
    const ev = this.evaluaciones().find((e) => e.id === data.id);
    if (!ev) return;
    this.evaluacionToDelete.set({ id: data.id, titulo: ev.titulo });
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

  viewDetails(evalId: string): void {
    const ev = this.evaluaciones().find((e) => e.id === evalId);
    if (ev) this.router.navigate(['/teacher/grades'], { queryParams: { evaluacionId: evalId, cursoId: ev.cursoId } });
  }
}
