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
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Parallel: get teacher info AND courses simultaneously
    // getTeacherCourses internally fetches docenteId, so we skip getTeacherInfo
    // and just use the courses response which already has what we need
    this.teacherQueryService.getTeacherCourses(this.userId).then((courses: TeacherCourse[]) => {
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
  openQuestionEditor(evalId: string): void {
    const ev = this.evaluaciones().find((e) => e.id === evalId);
    if (!ev) return;
    this.selectedEvalForQuestions.set({ id: ev.id, titulo: ev.titulo, puntajeMaximo: ev.puntajeMaximo });
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
