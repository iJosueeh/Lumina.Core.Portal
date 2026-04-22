import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
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
  TabType 
} from '@shared/models/course-management.models';

// Sub-components
import { CreateQuizzModalComponent } from './components/create-quizz-modal/create-quizz-modal.component';
import { QuestionEditorComponent } from './components/question-editor/question-editor.component';
import { AssignStudentModalComponent } from './components/assign-student-modal/assign-student-modal.component';
import { CourseHeroComponent } from '../../../../../shared/components/features/course-ui/course-hero/course-hero.component';
import { CourseStatsComponent } from './components/course-stats/course-stats.component';
import { CourseStudentsComponent } from './components/course-students/course-students.component';
import { CourseCurriculumComponent } from './components/course-curriculum/course-curriculum.component';
import { CourseEvaluationsComponent } from './components/course-evaluations/course-evaluations.component';
import { FilePreviewModalComponent, SharedFileResource } from '../../../../../shared/components/features/file-viewer/file-preview-modal/file-preview-modal.component';
import { TabNavComponent } from '../../../../../shared/components/ui/tab-nav/tab-nav.component';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    CreateQuizzModalComponent, 
    QuestionEditorComponent, 
    AssignStudentModalComponent,
    CourseHeroComponent,
    CourseStatsComponent,
    CourseStudentsComponent,
    CourseCurriculumComponent,
    CourseEvaluationsComponent,
    FilePreviewModalComponent,
    TabNavComponent
  ],
  templateUrl: './course-management.component.html',
  styleUrl: './course-management.component.css',
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseRepository = inject(TeacherCourseRepository);
  private studentRepository = inject(TeacherStudentRepository);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  public notificationService = inject(NotificationService);
  private courseMapper = inject(CourseMapper);

  // State
  courseId = signal<string>('');
  course = signal<TeacherCourseDetail | null>(null);
  students = signal<CourseStudent[]>([]);
  allTeacherStudents = signal<TeacherStudent[]>([]);
  modulos = signal<Modulo[]>([]);
  isLoading = signal(true);
  activeTab = signal<TabType>('overview');
  
  // Modal States
  showAssignStudentModal = signal(false);
  showCreateQuizzModal = signal(false);
  showQuestionEditor = signal(false);
  
  // Selected Item States
  editingQuizzId = signal('');
  editingQuizzTitle = signal('');
  selectedMaterial = signal<ModuloMaterial | null>(null);
  showMaterialPreview = signal(false);

  // Evaluaciones
  courseEvaluaciones = signal<EvaluacionApi[]>([]);
  isLoadingEvaluaciones = signal(false);

  // Computed values
  totalLecciones = computed(() => this.modulos().reduce((acc, m) => acc + m.lecciones.length, 0));

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.courseId.set(params['id']);
      this.loadCourseData();
    });
  }

  ngOnDestroy(): void {}

  loadCourseData(): void {
    this.isLoading.set(true);
    const usuarioId = this.authService.getUserId();
    const students$ = usuarioId ? this.studentRepository.getStudentsByTeacher(usuarioId).pipe(catchError(() => of([]))) : of([]);

    forkJoin({
      courseData: this.courseRepository.getCourseById(this.courseId()),
      allStudents: students$,
    }).subscribe({
      next: ({ courseData, allStudents }) => {
        this.allTeacherStudents.set(allStudents);
        const enrolledStudents = allStudents.filter((s) => s.cursos.includes(this.courseId()));

        this.course.set({
          ...courseData,
          id: courseData.id,
          totalAlumnos: enrolledStudents.length || courseData.totalAlumnos,
          alumnosActivos: enrolledStudents.length || courseData.alumnosActivos,
          coverImage: courseData.imagen || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
          stats: { aprobados: 0, reprobados: 0, enRiesgo: 0, tareasEntregadas: 0, tareasPendientes: 0, promedioMasAlto: 0, promedioMasBajo: 0 },
          evaluaciones: [],
        } as any);

        if (courseData.modulos && courseData.modulos.length > 0) {
          this.modulos.set(courseData.modulos.map((m: any, i: number) => this.courseMapper.mapApiModuloToModulo(m, i)));
        } else {
          this.modulos.set([{ id: '1', orden: 1, titulo: 'Introducción', descripcion: 'Conceptos básicos', duracion: '2h', materiales: [], completado: true, porcentajeCompletado: 100, lecciones: [] }]);
        }

        this.students.set(enrolledStudents.map((s) => this.courseMapper.mapTeacherStudentToCourseStudent(s)));
        this.isLoading.set(false);
        this.loadEvaluaciones();
      },
      error: () => this.isLoading.set(false),
    });
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

  onQuizzCreated(ev: { id: string; titulo: string }): void {
    this.showCreateQuizzModal.set(false);
    this.loadEvaluaciones();
    this.openQuestionEditor(ev);
  }

  openQuestionEditor(ev: { id: string, titulo: string }): void {
    this.editingQuizzId.set(ev.id);
    this.editingQuizzTitle.set(ev.titulo);
    this.showQuestionEditor.set(true);
  }

  // Material Actions
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

  goBack(): void { this.router.navigate(['/teacher/dashboard']); }
}
