import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';

interface Evaluacion {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  puntajeMaximo: number;
  tipoEvaluacion: string;
  estado: string;
  cursoId: string;
  cursoNombre?: string;
}

interface TeacherCourse {
  id: string;
  codigo: string;
  titulo: string;
}

@Component({
  selector: 'app-evaluations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './evaluations-list.component.html',
})
export class EvaluationsListComponent implements OnInit {
  courses = signal<TeacherCourse[]>([]);
  evaluaciones = signal<Evaluacion[]>([]);
  selectedCourseId = signal<string>('all');
  searchTerm = signal('');
  isLoading = signal(true);

  private userId = '';

  constructor(
    private http: HttpClient,
    private authRepository: AuthRepository,
    private teacherQueryService: TeacherQueryService,
    private router: Router,
  ) {
    this.userId = this.authRepository.getCurrentUser()?.id ?? '';
  }

  filteredEvaluaciones = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const courseId = this.selectedCourseId();
    let evaluaciones = this.evaluaciones();

    // Filtrar por curso
    if (courseId !== 'all') {
      evaluaciones = evaluaciones.filter((e) => e.cursoId === courseId);
    }

    // Filtrar por búsqueda
    if (term) {
      evaluaciones = evaluaciones.filter(
        (e) =>
          e.titulo.toLowerCase().includes(term) ||
          e.descripcion?.toLowerCase().includes(term) ||
          e.cursoNombre?.toLowerCase().includes(term),
      );
    }

    return evaluaciones;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Usar getTeacherInfo que recibe el userId
    this.teacherQueryService.getTeacherInfo(this.userId).then((teacher: any) => {
      if (teacher?.id) {
        // getTeacherCourses espera usuarioId, no docenteId
        this.teacherQueryService.getTeacherCourses(teacher.usuarioId).then((courses: TeacherCourse[]) => {
          this.courses.set(courses);
          this.loadAllEvaluations(courses);
        }).catch((err: any) => {
          console.error('❌ [EVALUATIONS-LIST] Error loading courses:', err);
          this.isLoading.set(false);
        });
      }
    }).catch((err: any) => {
      console.error('❌ [EVALUATIONS-LIST] Error loading teacher:', err);
      this.isLoading.set(false);
    });
  }

  loadAllEvaluations(courses: TeacherCourse[]): void {
    const requests = courses.map((course) =>
      this.http.get<{ mensaje: string; evaluaciones: any[] }>(
        `${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${course.id}`,
      ),
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        const allEvaluaciones: Evaluacion[] = [];
        responses.forEach((response, index) => {
          const course = courses[index];
          response.evaluaciones.forEach((ev: any) => {
            allEvaluaciones.push({
              id: ev.id,
              titulo: ev.titulo,
              descripcion: ev.descripcion,
              fechaInicio: ev.fechaInicio,
              fechaFin: ev.fechaFin,
              puntajeMaximo: ev.puntajeMaximo,
              tipoEvaluacion: this.mapTipoEnum(ev.tipoEvaluacion),
              estado: this.mapEstadoEnum(ev.estado),
              cursoId: course.id,
              cursoNombre: `${course.codigo} - ${course.titulo}`,
            });
          });
        });
        this.evaluaciones.set(allEvaluaciones);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ [EVALUATIONS-LIST] Error loading evaluations:', err);
        this.isLoading.set(false);
      },
    });
  }

  mapTipoEnum(tipo: number): string {
    const tipos = ['Examen', 'Práctica', 'Quiz', 'Parcial', 'Final', 'Tarea'];
    return tipos[tipo] || 'Desconocido';
  }

  mapEstadoEnum(estado: number): string {
    const estados = ['Borrador', 'Publicada', 'Cerrada'];
    return estados[estado] || 'Desconocido';
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: Record<string, string> = {
      Borrador: 'bg-gray-500/20 text-gray-300',
      Publicada: 'bg-green-500/20 text-green-400',
      Cerrada: 'bg-red-500/20 text-red-400',
    };
    return classes[estado] || 'bg-gray-500/20 text-gray-300';
  }

  getTipoBadgeClass(tipo: string): string {
    const classes: Record<string, string> = {
      Examen: 'bg-purple-500/20 text-purple-400',
      Práctica: 'bg-blue-500/20 text-blue-400',
      Quiz: 'bg-cyan-500/20 text-cyan-400',
      Parcial: 'bg-orange-500/20 text-orange-400',
      Final: 'bg-red-500/20 text-red-400',
      Tarea: 'bg-green-500/20 text-green-400',
    };
    return classes[tipo] || 'bg-gray-500/20 text-gray-300';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  viewEvaluationDetails(evaluacionId: string): void {
    // Navegar a la página de calificaciones con la evaluación seleccionada
    this.router.navigate(['/teacher/grades'], { queryParams: { evaluacionId } });
  }

  deleteEvaluation(evaluacionId: string, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de eliminar esta evaluación? Esta acción no se puede deshacer.')) {
      return;
    }

    this.http.delete(`${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}`).subscribe({
      next: () => {
        const courses = this.courses();
        this.loadAllEvaluations(courses);
      },
      error: (err) => {
        console.error('❌ [EVALUATIONS-LIST] Error deleting evaluation:', err);
        alert('Error al eliminar la evaluación');
      },
    });
  }
}
