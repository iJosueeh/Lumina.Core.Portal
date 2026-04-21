import { Component, OnDestroy, OnInit, signal, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    CreateQuizzModalComponent, 
    QuestionEditorComponent, 
    AssignStudentModalComponent
  ],
  templateUrl: './course-management.component.html',
  styleUrl: './course-management.component.css',
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  // Services
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseRepository = inject(TeacherCourseRepository);
  private studentRepository = inject(TeacherStudentRepository);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  public notificationService = inject(NotificationService);
  private courseMapper = inject(CourseMapper);

  // State Signals
  courseId = signal<string>('');
  course = signal<TeacherCourseDetail | null>(null);
  students = signal<CourseStudent[]>([]);
  allTeacherStudents = signal<TeacherStudent[]>([]);
  modulos = signal<Modulo[]>([]);
  expandedModules = signal<Set<string>>(new Set());
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

  // Computed values
  totalStudents = computed(() => this.course()?.totalAlumnos || 0);
  averageGrade = computed(() => this.course()?.promedioGeneral || 0);
  pendingEvaluations = computed(() => this.course()?.evaluaciones.filter((e) => e.estado === 'En Calificación').length || 0);
  totalLecciones = computed(() => this.modulos().reduce((acc, m) => acc + m.lecciones.length, 0));
  materialPreviewUrl = computed<SafeResourceUrl | null>(() => {
    const material = this.selectedMaterial();
    return material?.url ? this.sanitizer.bypassSecurityTrustResourceUrl(material.url) : null;
  });

  // Evaluaciones
  courseEvaluaciones = signal<EvaluacionApi[]>([]);
  isLoadingEvaluaciones = signal(false);

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
        const courseId = this.courseId();
        const enrolledStudents = allStudents.filter((s) => s.cursos.includes(courseId));

        this.course.set({
          id: courseData.id,
          codigo: courseData.codigo,
          titulo: courseData.titulo,
          descripcion: courseData.descripcion || 'Sin descripción',
          creditos: courseData.creditos,
          ciclo: courseData.ciclo,
          totalAlumnos: enrolledStudents.length || courseData.totalAlumnos,
          alumnosActivos: enrolledStudents.length || courseData.alumnosActivos,
          alumnosInactivos: 0,
          promedioGeneral: courseData.promedioGeneral,
          asistenciaPromedio: courseData.asistenciaPromedio,
          estadoCurso: courseData.estadoCurso,
          coverImage: courseData.imagen || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
          horario: courseData.horario || [],
          nivel: courseData.nivel,
          modalidad: courseData.modalidad,
          duracion: courseData.duracion,
          categoria: courseData.categoria,
          instructorNombre: courseData.instructor?.nombre,
          stats: { aprobados: 0, reprobados: 0, enRiesgo: 0, tareasEntregadas: 0, tareasPendientes: 0, promedioMasAlto: 0, promedioMasBajo: 0 },
          evaluaciones: [],
        });

        const modulosApi = courseData.modulos;
        if (modulosApi && Array.isArray(modulosApi) && modulosApi.length > 0) {
          this.modulos.set(modulosApi.map((m: any, i: number) => this.courseMapper.mapApiModuloToModulo(m, i)));
        } else {
          this.loadFallbackModules();
        }

        this.students.set(enrolledStudents.map((s) => this.courseMapper.mapTeacherStudentToCourseStudent(s)));
        this.isLoading.set(false);
        this.loadEvaluaciones();
      },
      error: () => this.isLoading.set(false),
    });
  }

  async loadEvaluaciones(): Promise<void> {
    const courseId = this.courseId();
    if (!courseId) return;
    this.isLoadingEvaluaciones.set(true);
    try {
      const resp = await firstValueFrom(this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${courseId}`));
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
    this.openQuestionEditor(ev.id, ev.titulo);
  }

  openQuestionEditor(id: string, titulo: string): void {
    this.editingQuizzId.set(id);
    this.editingQuizzTitle.set(titulo);
    this.showQuestionEditor.set(true);
  }

  // UI Helpers
  setActiveTab(tab: TabType): void { this.activeTab.set(tab); }
  
  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      'En Calificación': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pendiente: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      Activo: 'bg-teal-900/40 text-teal-300 border border-teal-500/30',
      Finalizado: 'bg-gray-800/60 text-gray-300 border border-gray-500/30',
      Programado: 'bg-blue-900/40 text-blue-300 border border-blue-500/30',
    };
    return colors[estado] || 'bg-gray-800/60 text-gray-400 border border-gray-600/30';
  }

  getStudentStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      Activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Inactivo: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getTimeAgo(timestamp: string): string {
    const diff = new Date().getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  getLeccionIcon(tipo: string): string {
    const icons: Record<string, string> = {
      video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      lectura: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      quiz: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      tarea: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[tipo] || icons['lectura'];
  }

  toggleModuleExpansion(moduleId: string): void {
    const current = new Set(this.expandedModules());
    current.has(moduleId) ? current.delete(moduleId) : current.add(moduleId);
    this.expandedModules.set(current);
  }

  openMaterial(material: ModuloMaterial): void {
    if (!material.url) {
      this.notificationService.show('error', 'El material no tiene URL disponible.');
      return;
    }
    this.selectedMaterial.set(material);
    this.showMaterialPreview.set(true);
  }

  async downloadMaterial(material: ModuloMaterial): Promise<void> {
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

  private loadFallbackModules(): void {
    this.modulos.set([
      { id: '1', orden: 1, titulo: 'Introducción', descripcion: 'Conceptos básicos', duracion: '2h', materiales: [], completado: true, porcentajeCompletado: 100, lecciones: [] },
    ]);
  }

  goBack(): void { this.router.navigate(['/teacher/dashboard']); }
}
