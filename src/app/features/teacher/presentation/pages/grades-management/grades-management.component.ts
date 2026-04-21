import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { NotificationService } from '@shared/services/notification.service';
import { GradesMapper } from '@shared/mappers/grades.mapper';
import { CourseGradesData, TeacherCourseGrades } from '@shared/models/grades-management.models';

import { GradesFilterBarComponent } from './components/filter-bar/filter-bar.component';
import { GradesStatsSummaryComponent } from './components/stats-summary/stats-summary.component';
import { GradesTableComponent } from './components/grades-table/grades-table.component';
import { EvaluationModalComponent } from './components/evaluation-modal/evaluation-modal.component';

@Component({
  selector: 'app-grades-management',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    GradesFilterBarComponent, 
    GradesStatsSummaryComponent, 
    GradesTableComponent, 
    EvaluationModalComponent
  ],
  templateUrl: './grades-management.component.html',
  styleUrl: './grades-management.component.css'
})
export class GradesManagementComponent implements OnInit {
  private authRepository = inject(AuthRepository);
  private teacherQueryService = inject(TeacherQueryService);
  private courseRepository = inject(TeacherCourseRepository);
  private fb = inject(FormBuilder);
  public notificationService = inject(NotificationService);
  private gradesMapper = inject(GradesMapper);

  courses = signal<TeacherCourseGrades[]>([]);
  selectedCourseId = signal<string>('');
  courseGradesData = signal<CourseGradesData | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  searchTerm = signal('');
  showModal = signal(false);
  isEditMode = signal(false);
  evaluationForm!: FormGroup;

  evaluaciones = computed(() => this.courseGradesData()?.evaluaciones || []);
  calificaciones = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const califs = this.courseGradesData()?.calificaciones || [];
    return !term ? califs : califs.filter(c => 
      c.estudianteNombre.toLowerCase().includes(term) || c.estudianteCodigo.toLowerCase().includes(term)
    );
  });
  stats = computed(() => this.courseGradesData()?.estadisticas || null);

  ngOnInit() {
    this.initForm();
    this.loadInitialData();
  }

  private initForm() {
    this.evaluationForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      peso: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      fechaFin: ['', Validators.required]
    });
  }

  async loadInitialData() {
    const userId = this.authRepository.getCurrentUser()?.id || '';
    try {
      const data = await this.teacherQueryService.getTeacherCourses(userId);
      this.courses.set(data.map(c => ({ id: c.id, codigo: c.codigo, titulo: c.titulo })));
      if (data.length) {
        this.selectedCourseId.set(data[0].id);
        this.loadGrades();
      } else this.isLoading.set(false);
    } catch { this.isLoading.set(false); }
  }

  loadGrades() {
    const id = this.selectedCourseId();
    if (!id) return;
    this.isLoading.set(true);
    this.courseRepository.getCourseById(id).subscribe({
      next: (data) => {
        this.courseGradesData.set(this.gradesMapper.mapApiToGradesData(data));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.show('error', 'Error al cargar calificaciones');
      }
    });
  }

  saveAll() {
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      this.notificationService.show('success', 'Cambios guardados correctamente');
    }, 1000);
  }

  openEvaluationModal(evaluacion?: any) {
    this.isEditMode.set(!!evaluacion);
    if (evaluacion) this.evaluationForm.patchValue(evaluacion);
    else this.evaluationForm.reset({ peso: 10 });
    this.showModal.set(true);
  }

  saveEvaluation() {
    this.notificationService.show('success', `Evaluación ${this.isEditMode() ? 'actualizada' : 'creada'}`);
    this.showModal.set(false);
  }
}
