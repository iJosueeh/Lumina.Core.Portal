import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';

// Models & Mappers
import { EvaluacionUI } from '@features/teacher/domain/models/evaluation.model';
import { TeacherCourse } from '@features/teacher/domain/models/teacher-course.model';
import { EvaluationMapper } from '../../../infrastructure/mappers/evaluation.mapper';

// Shared Components
import { EvaluationFilterComponent } from './components/evaluation-filter/evaluation-filter.component';
import { EvaluationCardComponent } from '../../../../../shared/components/features/evaluations/evaluation-card/evaluation-card.component';
import { SkeletonLoaderComponent } from '../../../../../shared/components/ui/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-evaluations-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    EvaluationFilterComponent, 
    EvaluationCardComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './evaluations-list.component.html',
})
export class EvaluationsListComponent implements OnInit {
  private http = inject(HttpClient);
  private authRepository = inject(AuthRepository);
  private teacherQueryService = inject(TeacherQueryService);
  private router = inject(Router);
  private mapper = inject(EvaluationMapper);

  courses = signal<TeacherCourse[]>([]);
  evaluaciones = signal<EvaluacionUI[]>([]);
  selectedCourseId = signal<string>('all');
  searchTerm = signal('');
  isLoading = signal(true);

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
    this.teacherQueryService.getTeacherInfo(this.userId).then((teacher: any) => {
      if (teacher?.id) {
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

    const requests = courses.map((course) =>
      this.http.get<{ mensaje: string; evaluaciones: any[] }>(
        `${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${course.id}`,
      ),
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        const all: EvaluacionUI[] = [];
        responses.forEach((response, index) => {
          const course = courses[index];
          response.evaluaciones.forEach((ev: any) => {
            all.push({
              ...ev,
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

  viewDetails(evaluacionId: string): void {
    this.router.navigate(['/teacher/grades'], { queryParams: { evaluacionId } });
  }

  deleteEvaluation(data: { id: string, event: Event }): void {
    if (!confirm('¿Estás seguro de eliminar esta evaluación?')) return;

    this.http.delete(`${environment.evaluacionesApiUrl}/evaluaciones/${data.id}`).subscribe({
      next: () => this.loadAllEvaluations(this.courses()),
      error: () => alert('Error al eliminar la evaluación'),
    });
  }
}
