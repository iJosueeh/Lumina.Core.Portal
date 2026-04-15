import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import {
  CourseDetail,
  Module,
  Lesson,
  CourseMaterial,
  MaterialType,
  Quiz,
  QuizAttempt,
  QuizSummary,
  QuestionAnswer,
  CourseSchedule,
} from '@features/student/domain/models/course-detail.model';
import { QuizTakeComponent } from '../../components/quiz-take/quiz-take.component';
import { QuizResultsComponent } from '../../components/quiz-results/quiz-results.component';
import { GetCourseDetailUseCase } from '@features/student/application/use-cases/get-course-detail.usecase';
import { MaterialsService } from '@features/student/infrastructure/services/materials.service';
import { EvaluationsIntegrationService } from '@features/student/infrastructure/services/evaluations-integration.service';
import { ProgressStorageService } from '@features/student/infrastructure/services/progress-storage.service';
import { AuthService } from '@core/services/auth.service';

type TabType = 'description' | 'content' | 'materials' | 'evaluations';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, QuizTakeComponent, QuizResultsComponent],
  templateUrl: './course-detail.component.html',
  styles: '',
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  activeTab: TabType = 'description';
  courseId = signal<string>('');
  studentId = signal<string>('');
  selectedMaterial = signal<CourseMaterial | null>(null);
  showMaterialPreview = signal(false);
  private sanitizer = inject(DomSanitizer);
  
  // Query Client para invalidar caché
  private queryClient = injectQueryClient();

  tabs = [
    { id: 'description' as TabType, label: 'Descripción', icon: 'document' },
    { id: 'content' as TabType, label: 'Contenido', icon: 'book' },
    { id: 'evaluations' as TabType, label: 'Evaluaciones', icon: 'clipboard-document-check' },
  ];

  // 🚀 TanStack Query - Carga paralela automática y caché inteligente
  courseQuery = injectQuery(() => ({
    queryKey: ['course-detail', this.courseId()],
    queryFn: async () => {
      console.time('⏱️ Query: Detalle del curso');
      const result = await lastValueFrom(
        this.getCourseDetailUseCase.execute(this.courseId())
      );
      console.timeEnd('⏱️ Query: Detalle del curso');
      return result;
    },
    enabled: !!this.courseId(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  }));

  materialsQuery = injectQuery(() => ({
    queryKey: ['course-materials', this.courseId()],
    queryFn: async () => {
      console.time('⏱️ Query: Materiales');
      const result = await lastValueFrom(
        this.materialsService.getMaterialsByCourse(this.courseId())
      );
      console.timeEnd('⏱️ Query: Materiales');
      return result;
    },
    enabled: !!this.courseId(),
    retry: 1,
  }));

  evaluationsQuery = injectQuery(() => ({
    queryKey: ['course-evaluations', this.courseId()],
    queryFn: async () => {
      console.time('⏱️ Query: Evaluaciones');
      const result = await lastValueFrom(
        this.evaluationsService.getEvaluationsByCourse(this.courseId())
      );
      console.timeEnd('⏱️ Query: Evaluaciones');
      return result;
    },
    enabled: !!this.courseId(),
    retry: 1,
  }));

  attemptsQuery = injectQuery(() => ({
    queryKey: ['quiz-attempts', this.studentId(), this.courseId()],
    queryFn: async () => {
      console.time('⏱️ Query: Intentos');
      const result = await lastValueFrom(
        this.evaluationsService.getQuizAttempts(this.studentId(), this.courseId())
      );
      console.timeEnd('⏱️ Query: Intentos');
      return result;
    },
    enabled: !!this.studentId() && !!this.courseId(),
    retry: 1,
  }));

  course = computed(() => this.courseQuery.data());
  materials = computed(() => this.materialsQuery.data() ?? []);
  quizzes = computed(() => this.evaluationsQuery.data() ?? []);
  attempts = computed(() => this.attemptsQuery.data() ?? []);
  materialPreviewUrl = computed<SafeResourceUrl | null>(() => {
    const material: CourseMaterial | null = this.selectedMaterial();
    return material?.url ? this.sanitizer.bypassSecurityTrustResourceUrl(material.url) : null;
  });
  
  isLoadingCourse = computed(() => 
    this.courseQuery.isLoading() || 
    this.courseQuery.isFetching()
  );
  
  isLoadingAny = computed(() =>
    this.courseQuery.isFetching() ||
    this.materialsQuery.isFetching() ||
    this.evaluationsQuery.isFetching() ||
    this.attemptsQuery.isFetching()
  );

  hasError = computed(() => !!this.courseQuery.error());
  errorMessage = computed(() => {
    const error = this.courseQuery.error();
    return error ? `Error al cargar el curso: ${error}` : '';
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private getCourseDetailUseCase: GetCourseDetailUseCase,
    private materialsService: MaterialsService,
    private evaluationsService: EvaluationsIntegrationService,
    private progressStorage: ProgressStorageService,
    private authService: AuthService
  ) {
    // Effect para logging de performance y aplicar progreso guardado
    effect(() => {
      const courseData = this.course();
      
      if (!this.isLoadingAny() && courseData) {
        console.log(`✅ Curso cargado: ${this.materials().length} materiales, ${this.quizzes().length} evaluaciones, ${this.attempts().length} intentos`);

        if (!this.expandedModules.size && courseData.modules?.length) {
          this.expandedModules.add(courseData.modules[0].id);
        }
        
        // Aplicar progreso guardado
        this.applyStoredProgress();
      }
    });
  }

  ngOnInit(): void {
    const courseIdParam = this.route.snapshot.params['id'] || '1';
    this.courseId.set(courseIdParam);
    
    const userId = this.authService.getUserId();
    if (userId) {
      this.studentId.set(userId);
    }

    // Leer query params
    this.route.queryParams.subscribe(params => {
      // Si viene un tab específico, activarlo
      if (params['tab']) {
        this.activeTab = params['tab'] as TabType;
      }
      
      // Si viene un evaluationId, abrir automáticamente los resultados
      if (params['evaluationId'] && this.activeTab === 'evaluations') {
        // Esperar a que se carguen los datos
        setTimeout(() => {
          const quizSummary = this.quizSummaries().find(q => q.id === params['evaluationId']);
          if (quizSummary && quizSummary.status === 'completed') {
            this.viewQuizResults(quizSummary);
          }
        }, 1000);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop';
  }

  private generateMockSchedule(): import('@features/student/domain/models/course-detail.model').CourseSchedule[] {
    const scheduleTypes: Array<{dias: string[], horario: {inicio: string, fin: string}, modalidad: 'Presencial' | 'Virtual' | 'Híbrido', aula: string, tipo: string}> = [
      {
        dias: ['Lunes', 'Miércoles'],
        horario: { inicio: '18:00', fin: '21:00' },
        modalidad: 'Presencial',
        aula: 'Aula 301',
        tipo: 'Teórica'
      },
      {
        dias: ['Martes', 'Jueves'],
        horario: { inicio: '19:00', fin: '22:00' },
        modalidad: 'Virtual',
        aula: 'Plataforma Online',
        tipo: 'Práctica'
      },
      {
        dias: ['Lunes', 'Viernes'],
        horario: { inicio: '16:00', fin: '19:00' },
        modalidad: 'Híbrido',
        aula: 'Lab 205',
        tipo: 'Laboratorio'
      },
      {
        dias: ['Miércoles', 'Viernes'],
        horario: { inicio: '20:00', fin: '22:00' },
        modalidad: 'Presencial',
        aula: 'Aula 102',
        tipo: 'Teórica'
      }
    ];

    // Seleccionar un tipo de horario basado en el ID del curso
    const courseNumber = parseInt(this.courseId()) || 1;
    const scheduleType = scheduleTypes[(courseNumber - 1) % scheduleTypes.length];

    return scheduleType.dias.map((dia, index) => ({
      id: `schedule-${this.courseId}-${index}`,
      diaSemana: dia,
      horaInicio: scheduleType.horario.inicio,
      horaFin: scheduleType.horario.fin,
      aula: scheduleType.aula,
      modalidad: scheduleType.modalidad,
      tipo: scheduleType.tipo,
      enlaceReunion: scheduleType.modalidad !== 'Presencial' ? 'https://meet.google.com/abc-defg-hij' : undefined
    }));
  }

  // Obtener texto legible del horario
  getScheduleText(): string {
    const courseData = this.course();
    if (!courseData?.schedule || courseData.schedule.length === 0) {
      return 'No definido';
    }

    return courseData.schedule
      .map((s: any) => `${s.diaSemana} ${s.horaInicio}-${s.horaFin}`)
      .join(', ');
  }

  // Obtener icono según modalidad
  getModalityIcon(modalidad: string): string {
    const icons: Record<string, string> = {
      'Presencial': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      'Virtual': 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      'Híbrido': 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
    };
    return icons[modalidad] || icons['Presencial'];
  }

  activeFilter = signal<MaterialType | 'all'>('all');
  searchQuery = signal('');

  // Tipos de materiales para filtros
  materialTypes: MaterialType[] = ['video', 'pdf', 'code', 'link', 'document'];

  // Computed: materiales filtrados
  filteredMaterials = computed(() => {
    let materials = this.materials();

    // Filtrar por tipo
    if (this.activeFilter() !== 'all') {
      materials = materials.filter((m: any) => m.type === this.activeFilter());
    }

    // Filtrar por búsqueda
    const query = this.searchQuery().toLowerCase();
    if (query) {
      materials = materials.filter(
        (m: any) =>
          m.title.toLowerCase().includes(query) ||
          m.moduleName.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query),
      );
    }

    return materials;
  });

  // Computed: materiales agrupados por módulo
  groupedMaterials = computed(() => {
    const materials = this.filteredMaterials();
    const grouped: { [key: string]: { moduleName: string; materials: CourseMaterial[] } } = {};

    materials.forEach((material) => {
      if (!grouped[material.moduleId]) {
        grouped[material.moduleId] = {
          moduleName: material.moduleName,
          materials: [],
        };
      }
      grouped[material.moduleId].materials.push(material);
    });

    return Object.values(grouped);
  });

  // ========== EVALUACIONES ==========
  // Filter signal para evaluaciones
  quizFilter = signal<'all' | 'pending' | 'completed'>('all');

  // Computed: quizzes con estado calculado
  quizSummaries = computed(() => {
    const quizzesList = this.quizzes();
    const attempts = this.attempts();
    
    return quizzesList.map(quiz => {
      const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
      const completedAttempts = quizAttempts.filter(a => a.status === 'completed');
      const bestAttempt = completedAttempts.reduce((best, current) => 
        !best || (current.percentage || 0) > (best.percentage || 0) ? current : best
      , null as QuizAttempt | null);

      // Determinar estado
      let status: 'not-started' | 'in-progress' | 'completed' | 'expired' = 'not-started';
      const now = new Date();
      const availableFrom = new Date(quiz.availableFrom);
      const availableUntil = quiz.availableUntil ? new Date(quiz.availableUntil) : null;

      if (availableUntil && now > availableUntil) {
        status = 'expired';
      } else if (now < availableFrom) {
        status = 'not-started';
      } else if (completedAttempts.length > 0) {
        status = 'completed';
      } else if (quizAttempts.some(a => a.status === 'in-progress')) {
        status = 'in-progress';
      }

      // 🔄 Migración: Convertir porcentajes antiguos (>20) a vigesimal
      let bestPercentage = bestAttempt?.percentage;
      if (bestPercentage && bestPercentage > 20) {
        bestPercentage = (bestPercentage / 100) * 20;
      }

      const summary: QuizSummary = {
        id: quiz.id,
        title: quiz.title,
        moduleId: quiz.moduleId,
        moduleName: quiz.moduleName,
        difficulty: quiz.difficulty,
        totalQuestions: quiz.totalQuestions,
        totalPoints: quiz.totalPoints,
        timeLimit: quiz.config.timeLimit,
        availableFrom: new Date(quiz.availableFrom),
        availableUntil: quiz.availableUntil ? new Date(quiz.availableUntil) : undefined,
        status,
        attemptsUsed: completedAttempts.length,
        attemptsAllowed: quiz.config.attemptsAllowed,
        bestScore: bestAttempt?.score,
        bestPercentage,
        passed: bestAttempt?.passed,
      };

      return summary;
    });
  });

  // Computed: evaluaciones filtradas
  filteredQuizzes = computed(() => {
    const summaries = this.quizSummaries();
    const filter = this.quizFilter();

    if (filter === 'all') return summaries;
    if (filter === 'pending') {
      return summaries.filter(q => q.status === 'not-started' || q.status === 'in-progress');
    }
    if (filter === 'completed') {
      return summaries.filter(q => q.status === 'completed');
    }

    return summaries;
  });

  // Computed: estadísticas de evaluaciones
  completedQuizzesCount = computed(() => 
    this.quizSummaries().filter(q => q.status === 'completed').length
  );

  pendingQuizzesCount = computed(() => 
    this.quizSummaries().filter(q => q.status === 'not-started' || q.status === 'in-progress').length
  );

  averageQuizScore = computed(() => {
    const quizzesWithScores = this.quizSummaries().filter(q => q.bestPercentage !== undefined);
    if (quizzesWithScores.length === 0) return 0;
    
    // 🔄 Normalizar notas (convertir porcentajes antiguos si existen)
    const normalizedScores = quizzesWithScores.map(q => {
      const score = q.bestPercentage || 0;
      return score > 20 ? (score / 100) * 20 : score;
    });
    
    const total = normalizedScores.reduce((sum, score) => sum + score, 0);
    return total / normalizedScores.length;
  });

  completionPercentage = computed(() => {
    const total = this.quizSummaries().length;
    if (total === 0) return 0;
    return (this.completedQuizzesCount() / total) * 100;
  });

  // Signal para quiz activo
  activeQuiz = signal<Quiz | null>(null);
  loadingQuiz = signal<boolean>(false);
  isQuizActive = computed(() => this.activeQuiz() !== null);

  // Signal para resultados activos
  activeResults = signal<{ quiz: Quiz; attempt: QuizAttempt } | null>(null);
  isResultsActive = computed(() => this.activeResults() !== null);

  // Computed: próxima lección no completada
  nextLesson = computed(() => {
    const courseData = this.course();
    if (!courseData?.modules) return null;
    
    for (const module of courseData.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.isCompleted && !lesson.isLocked) {
          return lesson;
        }
      }
    }
    return null;
  });

  setTab(tab: TabType): void {
    this.activeTab = tab;
  }

  expandedModules = new Set<string>();

  toggleModule(module: Module): void {
    module.isExpanded = !module.isExpanded;
    if (module.isExpanded) {
      this.expandedModules.add(module.id);
    } else {
      this.expandedModules.delete(module.id);
    }
  }

  getLessonIcon(type: string): string {
    const icons: Record<string, string> = {
      video: 'play-circle',
      reading: 'document-text',
      quiz: 'clipboard-document-check',
      assignment: 'pencil-square',
    };
    return icons[type] || 'document';
  }

  getTypeIcon(type: string): string {
    return this.getLessonIcon(type);
  }

  openLesson(module: Module, lesson: Lesson): void {
    if (lesson.type !== 'video') {
      this.startLesson(lesson);
      return;
    }

    this.openVideoClassroom(module, lesson);
  }

  openVideoClassroom(module: Module, lesson: Lesson): void {
    if (lesson.isLocked) {
      return;
    }

    this.router.navigate(['/student/course', this.courseId(), 'learn', lesson.id], {
      queryParams: { moduleId: module.id },
    });
  }

  startLesson(lesson: Lesson): void {
    if (lesson.isLocked) {
      return;
    }

    if (lesson.type === 'video') {
      const courseData = this.course();
      const lessonModule = courseData?.modules.find((module) =>
        (module.lessons || []).some((item) => item.id === lesson.id),
      );

      if (lessonModule) {
        this.openVideoClassroom(lessonModule, lesson);
        return;
      }
    }

    // Simular inicio de lección
    const lessonType =
      lesson.type === 'video'
        ? 'video'
        : lesson.type === 'reading'
          ? 'lectura'
          : lesson.type === 'quiz'
            ? 'quiz'
            : 'tarea';

    const message = lesson.isCompleted
      ? `Revisando ${lessonType}: "${lesson.title}"\n\nDuración: ${lesson.duration}\n\nEn una implementación completa, esto abriría el contenido de la lección en un modal o nueva página.`
      : `Iniciando ${lessonType}: "${lesson.title}"\n\nDuración: ${lesson.duration}\n\nEn una implementación completa, esto abriría el contenido de la lección en un modal o nueva página.`;

    alert(message);
  }

  private recalculateAndUpdateCourseProgress(updatedCourse: any): void {
    const totalLessons = updatedCourse.modules.reduce((total: number, module: any) => 
      total + (module.lessons?.length || 0), 0);
    const completedLessons = updatedCourse.modules.reduce((total: number, module: any) => 
      total + (module.lessons?.filter((l: any) => l.isCompleted).length || 0), 0);
    
    updatedCourse.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    const completedModules = updatedCourse.modules.filter((module: any) => 
      module.lessons?.length > 0 && module.lessons.every((l: any) => l.isCompleted)
    ).length;
    
    updatedCourse.completedModules = completedModules;
    
    this.queryClient.setQueryData(['course-detail', this.courseId()], updatedCourse);
  }

  toggleLessonCompletion(event: Event, lesson: Lesson): void {
    // Prevenir que se active el click del contenedor
    event.stopPropagation();
    
    if (lesson.isLocked) {
      return;
    }

    const courseData = this.course();
    if (!courseData?.modules) return;

    const updatedCourse = { ...courseData };
    updatedCourse.modules = courseData.modules.map(module => {
      const updatedModule = { ...module };
      updatedModule.lessons = module.lessons?.map(l => {
        if (l.id === lesson.id) {
          const newCompletedState = !l.isCompleted;

          this.progressStorage.saveLessonProgress(
            this.courseId(),
            this.studentId(),
            l.id,
            newCompletedState
          );

          return { ...l, isCompleted: newCompletedState };
        }
        return l;
      });
      return updatedModule;
    });

    this.recalculateAndUpdateCourseProgress(updatedCourse);

    const newLesson = updatedCourse.modules
      .flatMap(m => m.lessons || [])
      .find(l => l.id === lesson.id);

    const status = newLesson?.isCompleted ? '✅ completada' : '⭕ pendiente';
    console.log(`Lección "${lesson.title}" marcada como ${status}. Progreso: ${updatedCourse.progress}%`);
  }

  /**
   * Aplica el progreso guardado en localStorage a las lecciones del curso
   */
  private applyStoredProgress(): void {
    const courseData = this.course();
    if (!courseData?.modules) return;
    
    let appliedCount = 0;
    let hasChanges = false;
    
    // Clonar el curso para no mutar el original
    const updatedCourse = { ...courseData };
    updatedCourse.modules = courseData.modules.map(module => {
      const updatedModule = { ...module };
      updatedModule.lessons = module.lessons?.map(lesson => {
        const isSaved = this.progressStorage.isLessonCompleted(
          this.courseId(),
          this.studentId(),
          lesson.id
        );
        
        if (isSaved && !lesson.isCompleted) {
          appliedCount++;
          hasChanges = true;
          return { ...lesson, isCompleted: true };
        }
        return lesson;
      });
      return updatedModule;
    });
    
    if (hasChanges) {
      // Recalcular progreso manualmente
      const totalLessons = updatedCourse.modules.reduce((total, module) => 
        total + (module.lessons?.length || 0), 0);
      const completedLessons = updatedCourse.modules.reduce((total, module) => 
        total + (module.lessons?.filter(l => l.isCompleted).length || 0), 0);
      
      updatedCourse.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      const completedModules = updatedCourse.modules.filter(module => 
        module.lessons?.length > 0 && module.lessons.every(l => l.isCompleted)
      ).length;
      
      updatedCourse.completedModules = completedModules;
      
      console.log(`📦 Progreso restaurado: ${appliedCount} lecciones → ${updatedCourse.progress}% completado`);
      
      // Actualizar el cache con los datos modificados
      this.queryClient.setQueryData(['course-detail', this.courseId()], updatedCourse);
    }
  }

  continueCurrentLesson(): void {
    const next = this.nextLesson();
    if (next) {
      this.startLesson(next);
    } else {
      alert('¡Felicidades! Has completado todas las lecciones disponibles.');
    }
  }

  // Métodos para tab Materiales
  filterByType(type: MaterialType | 'all'): void {
    this.activeFilter.set(type);
  }

  searchMaterials(query: string): void {
    this.searchQuery.set(query);
  }

  countByType(type: MaterialType): number {
    return this.materials().filter((m: any) => m.type === type).length;
  }

  async downloadMaterial(material: CourseMaterial): Promise<void> {
    if (!material.url) {
      return;
    }

    try {
      const response = await fetch(material.url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`No se pudo descargar el archivo: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const downloadName = this.resolveFileName(material, response);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = downloadName;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('No se pudo forzar la descarga del material, usando fallback.', error);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = material.url;
      fallbackLink.download = this.resolveFileName(material);
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  }

  private resolveFileName(material: CourseMaterial, response?: Response): string {
    const disposition = response?.headers.get('content-disposition') || '';
    const quotedMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    if (quotedMatch?.[1]) {
      return decodeURIComponent(quotedMatch[1].trim());
    }

    try {
      const url = new URL(material.url);
      const fromPath = decodeURIComponent(url.pathname.split('/').pop() || '').trim();
      if (fromPath) {
        return fromPath;
      }
    } catch {
      // Ignorar y usar fallback por titulo.
    }

    return `${material.title || 'material'}`;
  }

  previewMaterial(material: CourseMaterial): void {
    if (!material.url) {
      return;
    }

    this.selectedMaterial.set(material);
    this.showMaterialPreview.set(true);
  }

  closeMaterialPreview(): void {
    this.showMaterialPreview.set(false);
    this.selectedMaterial.set(null);
  }

  getMaterialIcon(type: MaterialType): string {
    const icons: Record<MaterialType, string> = {
      video:
        'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      pdf: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      document:
        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[type];
  }

  getMaterialColor(type: MaterialType): string {
    const colors: Record<MaterialType, string> = {
      video: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      pdf: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      code: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      link: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
      document: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    };
    return colors[type];
  }

  getMaterialTypeLabel(type: MaterialType): string {
    const labels: Record<MaterialType, string> = {
      video: 'Video',
      pdf: 'PDF',
      code: 'Código',
      link: 'Enlace',
      document: 'Documento',
    };
    return labels[type];
  }

  hasRelatedMaterials(lesson: Lesson): boolean {
    return this.materials().some((m: any) => m.lessonId === lesson.id);
  }

  getMaterialsForLesson(lessonId: string): CourseMaterial[] {
    return this.materials().filter((m: any) => m.lessonId === lessonId);
  }

  hasMaterialsForModule(moduleId: string): boolean {
    return this.materials().some((m) => m.moduleId === moduleId);
  }

  getMaterialsForModule(moduleId: string): CourseMaterial[] {
    return this.materials().filter((m) => m.moduleId === moduleId);
  }

  getTotalLessons(): number {
    const courseData = this.course();
    return (
      courseData?.modules?.reduce((total: number, module: any) => total + (module.lessons?.length || 0), 0) || 0
    );
  }

  // ========== MÉTODOS PARA EVALUACIONES ==========
  
  // Filtrar evaluaciones
  filterQuizzes(filter: 'all' | 'pending' | 'completed'): void {
    this.quizFilter.set(filter);
  }

  // Obtener badge de estado de quiz
  getQuizStatusBadge(status: 'not-started' | 'in-progress' | 'completed' | 'expired'): string {
    const badges: { [key: string]: string } = {
      'not-started': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'expired': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  }

  // Obtener label de estado
  getQuizStatusLabel(status: 'not-started' | 'in-progress' | 'completed' | 'expired'): string {
    const labels: { [key: string]: string } = {
      'not-started': 'No Iniciado',
      'in-progress': 'En Progreso',
      'completed': 'Completado',
      'expired': 'Vencido',
    };
    return labels[status] || 'Desconocido';
  }

  // Obtener badge de dificultad
  getDifficultyBadge(difficulty: 'easy' | 'medium' | 'hard'): string {
    const badges: { [key: string]: string } = {
      'easy': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'hard': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return badges[difficulty] || 'bg-gray-100 text-gray-700';
  }

  // Obtener label de dificultad
  getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
    const labels: { [key: string]: string } = {
      'easy': 'Fácil',
      'medium': 'Medio',
      'hard': 'Difícil',
    };
    return labels[difficulty] || 'Desconocido';
  }

  // Iniciar evaluación
  startQuiz(quizSummary: QuizSummary): void {
    // Verificar si puede tomar el quiz
    if (quizSummary.attemptsUsed >= quizSummary.attemptsAllowed) {
      alert('Has agotado todos los intentos permitidos para esta evaluación.');
      return;
    }

    // Verificar si está vencido
    if (quizSummary.status === 'expired') {
      alert('Esta evaluación ha vencido.');
      return;
    }

    // Crear intento en el backend primero
    this.loadingQuiz.set(true);
    this.evaluationsService.createQuizAttempt(quizSummary.id, this.studentId()).subscribe({
      next: (intentoResponse) => {
        console.log('✅ Intento creado:', intentoResponse.intentoId);
        this.currentAttemptId.set(intentoResponse.intentoId);

        // Ahora cargar el quiz con todas sus preguntas
        this.evaluationsService.getEvaluacionConPreguntas(quizSummary.id).subscribe({
          next: (quizWithQuestions) => {
            this.loadingQuiz.set(false);
            this.activeQuiz.set(quizWithQuestions);
          },
          error: (err) => {
            console.error('❌ Error al cargar la evaluación con preguntas:', err);
            this.loadingQuiz.set(false);
            alert('Error al cargar la evaluación. Por favor, intente nuevamente.');
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al crear intento:', err);
        this.loadingQuiz.set(false);
        alert('Error al iniciar evaluación: ' + (err.error?.mensaje || err.message || 'Máximo de intentos alcanzado o error desconocido'));
      }
    });
  }

  // State for quiz submission
  submittingQuiz = signal<boolean>(false);
  currentAttemptId = signal<string | null>(null);

  // Manejar envío de quiz
  onQuizSubmit(attempt: QuizAttempt): void {
    console.log('🎯 Correctas:', attempt.answers.filter(a => a.isCorrect === true).length);
    console.log('❌ Incorrectas:', attempt.answers.filter(a => a.isCorrect === false).length);
    
    const currentQuiz = this.activeQuiz();
    if (!currentQuiz) {
      console.error('❌ No hay quiz activo');
      return;
    }

    const intentoId = this.currentAttemptId();
    if (!intentoId) {
      console.error('❌ No hay ID de intento');
      return;
    }

    // Mapear respuestas al formato del backend
    const respuestas = attempt.answers.map(answer => ({
      preguntaId: answer.questionId,
      respuestaEstudiante: Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer,
      esCorrecta: answer.isCorrect || false,
      puntosObtenidos: (answer.isCorrect ? (currentQuiz.questions.find(q => q.id === answer.questionId)?.points || 0) : 0)
    }));

    this.submittingQuiz.set(true);

    // Enviar respuestas al backend
    // Usar la suma real de puntos de las preguntas como puntajeMaximo para escala vigesimal correcta
    const puntajeMaximo = currentQuiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) || currentQuiz.totalPoints;
    this.evaluationsService.submitQuizAttempt(
      intentoId,
      respuestas,
      puntajeMaximo,
      this.studentId(),
      attempt.timeSpent ?? undefined
    ).subscribe({
      next: (result) => {
        console.log('✅ Evaluación enviada exitosamente:', result);
        this.submittingQuiz.set(false);
        
        // Actualizar el intento con la calificación del backend
        const updatedAttempt: QuizAttempt = {
          ...attempt,
          score: result.calificacion,
          percentage: result.calificacion,
          completedAt: new Date()
        };

        // Cerrar quiz
        this.activeQuiz.set(null);
        this.currentAttemptId.set(null);

        // Mostrar resultados
        this.activeResults.set({ quiz: currentQuiz, attempt: updatedAttempt });

        // Refrescar intentos
        this.attemptsQuery.refetch();
      },
      error: (err) => {
        console.error('❌ Error al enviar evaluación:', err);
        this.submittingQuiz.set(false);
        alert('Error al enviar evaluación: ' + (err.error?.mensaje || err.message || 'Error desconocido'));
      }
    });
  }

  // Cancelar quiz
  onQuizCancel(): void {
    const intentoId = this.currentAttemptId();
    if (intentoId) {
      this.evaluationsService.abandonQuizAttempt(intentoId).subscribe();
    }
    this.activeQuiz.set(null);
    this.currentAttemptId.set(null);
  }

  ngOnDestroy(): void {
    const intentoId = this.currentAttemptId();
    if (intentoId) {
      this.evaluationsService.abandonQuizAttempt(intentoId).subscribe();
    }
  }

  // Ver resultados
  viewQuizResults(quizSummary: QuizSummary): void {
    // Buscar el mejor intento
    const attempts = this.attempts().filter((a: any) => a.quizId === quizSummary.id && a.status === 'completed');
    const bestAttempt = attempts.reduce((best: any, current: any) =>
      !best || (current.percentage || 0) > (best.percentage || 0) ? current : best
    , null as QuizAttempt | null);

    if (!bestAttempt) {
      alert('No se encontraron intentos completados para esta evaluación.');
      return;
    }

    // Siempre cargar el quiz con preguntas completas para mostrar la revisión correctamente
    this.loadingQuiz.set(true);
    this.evaluationsService.getEvaluacionConPreguntas(quizSummary.id).subscribe({
      next: (quizWithQuestions) => {
        this.loadingQuiz.set(false);
        if (!bestAttempt.answers || bestAttempt.answers.length === 0) {
          // Sin respuestas en BD: generar mock normalizando el porcentaje
          const totalPts = quizWithQuestions.questions.reduce((s, q) => s + (q.points || 0), 0);
          const pctForMock = totalPts > 0
            ? Math.min(((bestAttempt.percentage || 0) / totalPts) * 100, 100)
            : Math.min(((bestAttempt.percentage || 0) / 20) * 100, 100);
          const mockAnswers = this.generateMockAnswers(quizWithQuestions, pctForMock);
          this.activeResults.set({ quiz: quizWithQuestions, attempt: { ...bestAttempt, answers: mockAnswers } });
        } else {
          this.activeResults.set({ quiz: quizWithQuestions, attempt: bestAttempt });
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar quiz con preguntas:', err);
        this.loadingQuiz.set(false);
        alert('Error al cargar los detalles de la evaluación.');
      }
    });
  }

  // Generar respuestas mock para intentos sin respuestas del backend
  private generateMockAnswers(quiz: Quiz, percentage: number): QuestionAnswer[] {
    if (!quiz.questions || quiz.questions.length === 0) {
      console.warn('⚠️ No hay preguntas en el quiz para generar respuestas mock');
      return [];
    }

    const totalQuestions = quiz.questions.length;
    const correctAnswersNeeded = Math.round((percentage / 100) * totalQuestions);
    console.log(`🎲 Generando ${correctAnswersNeeded} respuestas correctas de ${totalQuestions} para ${percentage}%`);

    return quiz.questions.map((question, index) => {
      // Decidir si esta pregunta será correcta o incorrecta
      const isCorrect = index < correctAnswersNeeded;
      
      let answer: string | string[];
      let pointsEarned = 0;

      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        if (isCorrect) {
          // Seleccionar la opción correcta
          const correctOption = question.options?.find(opt => opt.isCorrect);
          answer = correctOption?.id || '';
          pointsEarned = question.points;
        } else {
          // Seleccionar una opción incorrecta
          const incorrectOption = question.options?.find(opt => !opt.isCorrect);
          answer = incorrectOption?.id || '';
          pointsEarned = 0;
        }
      } else if (question.type === 'short-answer') {
        if (isCorrect) {
          answer = question.correctAnswer || 'Respuesta correcta';
          pointsEarned = question.points;
        } else {
          answer = 'Respuesta incorrecta';
          pointsEarned = 0;
        }
      } else {
        answer = '';
        pointsEarned = 0;
      }

      return {
        questionId: question.id,
        answer,
        isCorrect,
        pointsEarned
      };
    });
  }

  // Cerrar resultados
  onResultsClose(): void {
    this.activeResults.set(null);
  }

  // Reintentar desde resultados
  onResultsRetry(): void {
    const results = this.activeResults();
    if (!results) return;

    // Cerrar resultados
    this.activeResults.set(null);

    // Buscar el quiz summary
    const quizSummary = this.quizSummaries().find(q => q.id === results.quiz.id);
    if (quizSummary) {
      this.startQuiz(quizSummary);
    }
  }

  // Obtener color de calificación (escala vigesimal 0-20)
  getScoreColor(grade: number): string {
    if (grade >= 17) return 'text-green-600 dark:text-green-400'; // Excelente
    if (grade >= 14) return 'text-blue-600 dark:text-blue-400';   // Bueno
    if (grade >= 10.5) return 'text-yellow-600 dark:text-yellow-400'; // Aprobado
    return 'text-red-600 dark:text-red-400';  // Desaprobado
  }
}

