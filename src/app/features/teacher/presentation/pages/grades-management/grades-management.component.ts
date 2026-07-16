import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { NotificationService } from '@shared/services/notification.service';
import { TeacherGradesService } from '@features/teacher/infrastructure/services/teacher-grades.service';
import { CourseGradesData, TeacherCourseGrades } from '@shared/models/grades-management.models';

import { GradesFilterBarComponent } from './components/filter-bar/filter-bar.component';
import { GradesStatsSummaryComponent } from './components/stats-summary/stats-summary.component';
import { GradesTableComponent } from './components/grades-table/grades-table.component';
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';

@Component({
  selector: 'app-grades-management',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    GradesFilterBarComponent,
    GradesStatsSummaryComponent,
    GradesTableComponent,
  ],
  templateUrl: './grades-management.component.html',
  styleUrl: './grades-management.component.css'
})
export class GradesManagementComponent implements OnInit {
  private authRepository = inject(AuthRepository);
  private teacherQueryService = inject(TeacherQueryService);
  private gradesService = inject(TeacherGradesService);
  private route = inject(ActivatedRoute);
  public notificationService = inject(NotificationService);

  courses = signal<TeacherCourseGrades[]>([]);
  selectedCourseId = signal<string>('');
  courseGradesData = signal<CourseGradesData | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  searchTerm = signal('');

  evaluaciones = computed(() => this.courseGradesData()?.evaluaciones || []);
  evaluacionIds = computed(() => this.evaluaciones().map(e => e.id));
  calificaciones = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const califs = this.courseGradesData()?.calificaciones || [];
    return !term ? califs : califs.filter(c => 
      c.estudianteNombre.toLowerCase().includes(term) || c.estudianteCodigo.toLowerCase().includes(term)
    );
  });
  stats = computed(() => this.courseGradesData()?.estadisticas || null);

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    const userId = this.authRepository.getCurrentUser()?.id || '';
    const cursoIdFromQuery = this.route.snapshot.queryParams['cursoId'];
    try {
      const data = await this.teacherQueryService.getTeacherCourses(userId);
      this.courses.set(data.map(c => ({ id: c.id, codigo: c.codigo, titulo: c.titulo })));
      if (data.length) {
        const targetId = cursoIdFromQuery && data.some(c => c.id === cursoIdFromQuery)
          ? cursoIdFromQuery
          : data[0].id;
        this.selectedCourseId.set(targetId);
        this.loadGrades();
      } else this.isLoading.set(false);
    } catch { this.isLoading.set(false); }
  }

  loadGrades() {
    const id = this.selectedCourseId();
    if (!id) return;
    this.isLoading.set(true);
    this.gradesService.getCourseGrades(id).subscribe({
      next: (data) => {
        this.courseGradesData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.show('error', 'Error al cargar calificaciones');
      }
    });
  }

  saveAll() {
    const data = this.courseGradesData();
    if (!data) return;
    this.isSaving.set(true);

    // Agrupar calificaciones por evaluacionId → [{ estudianteId, nota }]
    const porEvaluacion = new Map<string, { estudianteId: string; nota: number }[]>();
    for (const calif of data.calificaciones) {
      for (const [evalId, nota] of Object.entries(calif.notas)) {
        if (nota == null) continue;
        if (!porEvaluacion.has(evalId)) porEvaluacion.set(evalId, []);
        porEvaluacion.get(evalId)!.push({ estudianteId: calif.estudianteId, nota });
      }
    }

    if (porEvaluacion.size === 0) {
      this.isSaving.set(false);
      this.notificationService.show('info', 'No hay calificaciones para guardar');
      return;
    }

    // POST por cada evaluación
    const requests = Array.from(porEvaluacion.entries()).map(([evalId, califs]) =>
      this.gradesService.guardarCalificaciones(evalId, califs)
    );

    // Esperar a que todas terminen
    let completados = 0;
    let errores = 0;
    for (const req of requests) {
      req.subscribe({
        next: () => {
          completados++;
          if (completados + errores === requests.length) this.finalizarGuardado(completados, errores);
        },
        error: () => {
          errores++;
          if (completados + errores === requests.length) this.finalizarGuardado(completados, errores);
        }
      });
    }
  }

  private finalizarGuardado(completados: number, errores: number) {
    this.isSaving.set(false);
    if (errores === 0) {
      this.notificationService.show('success', `Calificaciones guardadas (${completados} evaluación(es))`);
    } else {
      this.notificationService.show('error', `Error al guardar (${errores} fallaron)`);
    }
  }

  onGradeChange(event: { estudianteId: string; evaluacionId: string; nota: number | null }) {
    const data = this.courseGradesData();
    if (!data) return;
    const calif = data.calificaciones.find(c => c.estudianteId === event.estudianteId);
    if (calif) {
      calif.notas[event.evaluacionId] = event.nota;
      const notasArr = Object.values(calif.notas).filter((n): n is number => n != null);
      calif.promedio = notasArr.length
        ? Number((notasArr.reduce((a, b) => a + b, 0) / notasArr.length).toFixed(2))
        : 0;
    }
  }
}
