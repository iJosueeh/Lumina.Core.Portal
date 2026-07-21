import { Component, OnDestroy, OnInit, signal, computed, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { TeacherStudentRepository } from '@features/teacher/domain/repositories/teacher-student.repository';
import { TeacherStudent } from '@features/teacher/domain/models/teacher-student.model';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';

// Shared
import { NotificationService } from '@shared/services/notification.service';

import { CourseMapper } from '@shared/mappers/course.mapper';
import { 
  EvaluacionApi, 
  TeacherCourseDetail, 
  Modulo, 
  ModuloMaterial, 
  CourseStudent, 
  TabType,
  Leccion
} from '@shared/models/course-management.models';

// Shared Components
import { EvaluacionModalComponent } from '@shared/components/modals/evaluacion-modal/evaluacion-modal.component';
import { CourseHeroComponent } from '@shared/components/features/course-ui/course-hero/course-hero.component';
import { FilePreviewModalComponent, SharedFileResource } from '@shared/components/features/file-viewer/file-preview-modal/file-preview-modal.component';
import { TabNavComponent } from '@shared/components/ui/tab-nav/tab-nav.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { AddContentModalComponent } from '@shared/components/modals/add-content-modal/add-content-modal.component';
import { AddModuleModalComponent } from '@shared/components/modals/add-module-modal/add-module-modal.component';

// Sub-components (Moved to Shared)
import { CourseStatsComponent } from '@shared/components/features/course-management/course-stats/course-stats.component';
import { CourseStudentsComponent } from '@shared/components/features/course-management/course-students/course-students.component';
import { CourseCurriculumComponent } from '@shared/components/features/course-management/course-curriculum/course-curriculum.component';
import { CourseEvaluationsComponent } from '@shared/components/features/course-management/course-evaluations/course-evaluations.component';

// Features (Teacher specific - but used for state management)
import { QuestionEditorComponent } from '@features/teacher/presentation/pages/course-management/components/question-editor/question-editor.component';
import { AssignStudentModalComponent } from '@features/teacher/presentation/pages/course-management/components/assign-student-modal/assign-student-modal.component';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';

@Component({
  selector: 'app-course-management-shared',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    EvaluacionModalComponent, 
    QuestionEditorComponent, 
    AssignStudentModalComponent,
    CourseHeroComponent,
    CourseStatsComponent,
    CourseStudentsComponent,
    CourseCurriculumComponent,
    CourseEvaluationsComponent,
    FilePreviewModalComponent,
    TabNavComponent,
    SkeletonLoaderComponent,
    AddContentModalComponent,
    AddModuleModalComponent,
  ],
  templateUrl: './course-management-shared.component.html',
  styleUrl: './course-management-shared.component.css',
})
export class CourseManagementSharedComponent implements OnInit, OnDestroy {
  @Input() role: 'teacher' | 'admin' = 'teacher';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseRepository = inject(TeacherCourseRepository);
  private studentRepository = inject(TeacherStudentRepository);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  public notificationService = inject(NotificationService);
  private courseMapper = inject(CourseMapper);
  private teacherQuery = inject(TeacherQueryService);


  // State
  courseId = signal<string>('');
  course = signal<TeacherCourseDetail | null>(null);
  students = signal<CourseStudent[]>([]);
  allTeacherStudents = signal<TeacherStudent[]>([]);
  modulos = signal<Modulo[]>([]);
  isLoading = signal(true);
  activeTab = signal<TabType>('overview');
  tabs = signal([
    { id: 'overview', label: 'Contenido y Alumnos', icon: 'book' },
    { id: 'evaluaciones', label: 'Evaluaciones', icon: 'clipboard-list' }
  ] as any[]);
  
  // Modal States
  showAssignStudentModal = signal(false);
  showEvaluacionModal = signal(false);
  showQuestionEditor = signal(false);
  showAddContentModal = signal(false);
  showAddModuleModal = signal(false);
  
  // Selected Item States
  editingQuizzId = signal('');
  editingQuizzTitle = signal('');
  editingEvaluacion = signal<EvaluacionApi | null>(null);
  selectedMaterial = signal<ModuloMaterial | null>(null);
  showMaterialPreview = signal(false);
  activeModuloId = signal('');
  editingLeccion = signal<Leccion | null>(null);
  editingModulo = signal<{id: string, titulo: string, descripcion: string} | null>(null);
  currentDocenteId = signal<string | null>(null);

  // Evaluaciones
  courseEvaluaciones = signal<EvaluacionApi[]>([]);
  isLoadingEvaluaciones = signal(false);

  // Computed values
  totalLecciones = computed(() => this.modulos().reduce((acc, m) => acc + (m.lecciones?.length || 0), 0));

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.courseId.set(params['id']);
      this.loadCourseData();
      if (this.role === 'teacher') {
        this.loadDocenteInfo();
      }
    });
  }


  async loadDocenteInfo(): Promise<void> {
    const usuarioId = this.authService.getUserId();
    if (usuarioId) {
      try {
        const info = await this.teacherQuery.getTeacherInfo(usuarioId);
        this.currentDocenteId.set(info.id);
      } catch (err) {
        console.error('❌ [COURSE-MGMT] Error loading docente info:', err);
      }
    }
  }

  ngOnDestroy(): void {}

  loadCourseData(): void {
    console.log('📥 [COURSE-MGMT] Loading Course Data for:', this.courseId());
    this.isLoading.set(true);
    
    const usuarioId = this.authService.getUserId();
    const students$ = (this.role === 'teacher' && usuarioId)
        ? this.studentRepository.getStudentsByTeacher(usuarioId).pipe(catchError(() => of([])))
        : this.http.get<any[]>(`${environment.estudiantesApiUrl}/estudiantes/por-curso/${this.courseId()}`).pipe(catchError(() => of([])));

    forkJoin({
      courseData: this.courseRepository.getCourseById(this.courseId()),
      allStudents: students$,
    }).subscribe({
      next: ({ courseData, allStudents }) => {
        console.log('✅ [COURSE-MGMT] Data Received', { courseData, studentsCount: allStudents.length });
        
        this.allTeacherStudents.set(Array.isArray(allStudents) ? allStudents : []);
        
        const rawData = courseData as any;
        if (this.role === 'admin' && rawData.instructorId) {
            this.currentDocenteId.set(rawData.instructorId);
        }

        this.course.set({
          ...courseData,
          id: courseData.id,
          totalAlumnos: allStudents.length || courseData.totalAlumnos,
          alumnosActivos: allStudents.length || courseData.alumnosActivos,
          coverImage: courseData.imagen || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
          stats: { aprobados: 0, reprobados: 0, enRiesgo: 0, tareasEntregadas: 0, tareasPendientes: 0, promedioMasAlto: 0, promedioMasBajo: 0 },
          evaluaciones: [],
        } as any);

        // Actualizamos los módulos siempre, incluso si está vacío
        const rawModulos = courseData.modulos || [];
        console.log(`📦 [COURSE-MGMT] Procesando ${rawModulos.length} módulos.`);
        this.modulos.set(rawModulos.map((m: any, i: number) => this.courseMapper.mapApiModuloToModulo(m, i)));
        
        this.students.set(this.allTeacherStudents().map((s: any) => this.courseMapper.mapTeacherStudentToCourseStudent(s)));
        this.isLoading.set(false);
        this.loadEvaluaciones();
      },
      error: (err) => {
        console.error('❌ [COURSE-MGMT] Error loading data', err);
        this.isLoading.set(false);
      }
    });
  }

  openAddContent(moduloId: string): void {
    console.log('➕ [COURSE-MGMT] Opening Add Content Modal for Modulo:', moduloId);
    this.editingLeccion.set(null); 
    this.activeModuloId.set(moduloId);
    this.showAddContentModal.set(true);
  }

  openEditLesson(ev: {moduloId: string, leccion: Leccion}): void {
    console.log('✏️ [COURSE-MGMT] Opening Edit Modal for Lesson:', ev.leccion.id);
    this.activeModuloId.set(ev.moduloId);
    this.editingLeccion.set(ev.leccion);
    this.showAddContentModal.set(true);
  }

  onContentSaved(): void {
    this.notificationService.show('success', 'Contenido publicado exitosamente.');
    this.loadCourseData();
  }

  previewLesson(lessonId: string): void {
    const base = this.role === 'teacher' ? '/teacher/course' : '/admin/course';
    this.router.navigate([base, this.courseId(), 'preview', lessonId]);
  }

  openCreateModule(): void {
    this.editingModulo.set(null);
    this.showAddModuleModal.set(true);
  }

  openEditModule(modulo: Modulo): void {
    this.editingModulo.set({
      id: modulo.id,
      titulo: modulo.titulo,
      descripcion: modulo.descripcion
    });
    this.showAddModuleModal.set(true);
  }

  async createModule(data: {titulo: string, descripcion: string}): Promise<void> {
    // Validación en frontend antes de enviar
    if (!data.titulo || data.titulo.trim().length < 3) {
      this.notificationService.show('error', 'El título debe tener al menos 3 caracteres.');
      return;
    }

    const courseId = this.courseId();
    if (!courseId) {
      this.notificationService.show('error', 'No se pudo identificar el curso. Intente recargar la página.');
      console.error('❌ [COURSE-MGMT] courseId is empty');
      return;
    }

    console.log('🚀 [COURSE-MGMT] Creating module:', data);
    try {
        const url = `${environment.cursosApiUrl}/cursos/${courseId}/modulos`;
        const payload = {
            titulo: data.titulo.trim(),
            descripcion: data.descripcion?.trim() || ''
        };
        console.log(`📤 [COURSE-MGMT] POST ${url}`, payload);
        
        const response = await firstValueFrom(this.http.post<any>(url, payload));
        console.log('✅ [COURSE-MGMT] Module created response:', response);
        
        if (response?.success) {
          this.notificationService.show('success', `Módulo "${data.titulo}" creado exitosamente.`);
          this.showAddModuleModal.set(false);
          
          console.log('🔄 [COURSE-MGMT] Refreshing course data...');
          this.loadCourseData();
        } else {
          console.warn('⚠️ [COURSE-MGMT] Unexpected response:', response);
          this.notificationService.show('info', 'Módulo creado. Actualizando vista...');
          this.showAddModuleModal.set(false);
          this.loadCourseData();
        }
    } catch (err: any) {
        console.error('❌ [COURSE-MGMT] Error creating module:', err);
        const errorMsg = err?.error?.error || err?.message || 'No se pudo crear el módulo.';
        this.notificationService.show('error', `Error: ${errorMsg}`);
    }
  }

  async updateModule(data: {id: string, titulo: string, descripcion: string}): Promise<void> {
    if (!data.titulo || data.titulo.trim().length < 3) {
      this.notificationService.show('error', 'El título debe tener al menos 3 caracteres.');
      return;
    }

    const courseId = this.courseId();
    if (!courseId) {
      this.notificationService.show('error', 'No se pudo identificar el curso.');
      return;
    }

    try {
        console.log(`📤 [COURSE-MGMT] PUT ${environment.cursosApiUrl}/cursos/${courseId}/modulos/${data.id}`, data);
        await firstValueFrom(this.http.put(`${environment.cursosApiUrl}/cursos/${courseId}/modulos/${data.id}`, {
            titulo: data.titulo.trim(),
            descripcion: data.descripcion?.trim() || ''
        }));
        this.notificationService.show('success', 'Módulo actualizado correctamente.');
        this.showAddModuleModal.set(false);
        this.loadCourseData();
    } catch (err: any) {
        console.error('❌ [COURSE-MGMT] Error updating module:', err);
        const errorMsg = err?.error?.error || 'No se pudo actualizar el módulo.';
        this.notificationService.show('error', `Error: ${errorMsg}`);
    }
  }

  async deleteModule(moduloId: string): Promise<void> {
    const courseId = this.courseId();
    if (!courseId) {
      this.notificationService.show('error', 'No se pudo identificar el curso.');
      return;
    }

    try {
        console.log(`🗑️ [COURSE-MGMT] DELETE ${environment.cursosApiUrl}/cursos/${courseId}/modulos/${moduloId}`);
        await firstValueFrom(this.http.delete(`${environment.cursosApiUrl}/cursos/${courseId}/modulos/${moduloId}`));
        this.notificationService.show('success', 'Módulo eliminado correctamente.');
        this.showAddModuleModal.set(false);
        this.loadCourseData();
    } catch (err: any) {
        console.error('❌ [COURSE-MGMT] Error deleting module:', err);
        const errorMsg = err?.error?.error || 'No se pudo eliminar el módulo.';
        this.notificationService.show('error', `Error: ${errorMsg}`);
    }
  }

  async loadEvaluaciones(): Promise<void> {
    if (!this.courseId()) return;
    this.isLoadingEvaluaciones.set(true);
    try {
      const resp = await firstValueFrom(this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${this.courseId()}`));
      this.courseEvaluaciones.set((resp.evaluaciones || []).map((e: any) => ({
        id: e.id,
        titulo: e.titulo,
        tipoEvaluacion: e.tipoEvaluacion ?? e.tipo ?? 'Quizz',
        fechaInicio: e.fechaInicio,
        fechaFin: e.fechaFin ?? e.fechaLimite,
        estado: e.estado ?? 'Pendiente',
        totalPreguntas: e.totalPreguntas ?? 0,
        puntajeMaximo: e.puntajeMaximo ?? 0,
      })));
    } catch (err) {
      console.error('❌ Error loading evaluaciones:', err);
    } finally {
      this.isLoadingEvaluaciones.set(false);
    }
  }

  openEvaluacionModal(evaluacion?: EvaluacionApi): void {
    if (evaluacion) {
      this.editingEvaluacion.set(evaluacion);
    } else {
      this.editingEvaluacion.set(null);
    }
    this.showEvaluacionModal.set(true);
  }

  onEvaluacionSaved(ev: { id: string; titulo: string }): void {
    this.showEvaluacionModal.set(false);
    this.loadEvaluaciones();
    if (!this.editingEvaluacion()) {
      this.openQuestionEditor(ev);
    }
  }

  openQuestionEditor(ev: { id: string, titulo: string }): void {
    this.editingQuizzId.set(ev.id);
    this.editingQuizzTitle.set(ev.titulo);
    this.showQuestionEditor.set(true);
  }

  openMaterial(material: ModuloMaterial): void {
    if (!material.url) {
      this.notificationService.show('error', 'El material no tiene URL disponible.');
      return;
    }
    this.selectedMaterial.set(material);
    this.showMaterialPreview.set(true);
  }

  async downloadMaterial(material: SharedFileResource): Promise<void> {
    if (!material.url) return;
    try {
      const response = await fetch(material.url, { credentials: 'include' });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = material.titulo || 'material';
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(material.url, '_blank');
    }
  }

  closeAssignModal(): void {
    this.showAssignStudentModal.set(false);
  }

  handleTabChange(tabId: string): void {
    this.activeTab.set(tabId as TabType);
  }

  goBack(): void { 
    const target = this.role === 'teacher' ? '/teacher/dashboard' : '/admin/courses';
    this.router.navigate([target]); 
  }
}
