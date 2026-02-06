import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  CourseDetail,
  Module,
  Lesson,
  CourseMaterial,
  MaterialType,
  Quiz,
  QuizAttempt,
  QuizSummary,
} from '@features/student/domain/models/course-detail.model';
import { QuizTakeComponent } from '../../components/quiz-take/quiz-take.component';
import { QuizResultsComponent } from '../../components/quiz-results/quiz-results.component';
import { GetCourseDetailUseCase } from '@features/student/application/use-cases/get-course-detail.usecase';
import { MaterialsService } from '@features/student/infrastructure/services/materials.service';
import { EvaluationsIntegrationService } from '@features/student/infrastructure/services/evaluations-integration.service';

type TabType = 'description' | 'content' | 'materials' | 'evaluations';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, QuizTakeComponent, QuizResultsComponent],
  templateUrl: './course-detail.component.html',
  styles: ``,
})
export class CourseDetailComponent implements OnInit {
  activeTab: TabType = 'content';
  courseId: string = '';

  tabs = [
    { id: 'description' as TabType, label: 'Descripción', icon: 'document' },
    { id: 'content' as TabType, label: 'Contenido', icon: 'book' },
    { id: 'materials' as TabType, label: 'Materiales', icon: 'folder' },
    { id: 'evaluations' as TabType, label: 'Evaluaciones', icon: 'clipboard-document-check' },
  ];

  course: CourseDetail = {} as CourseDetail;

  constructor(
    private route: ActivatedRoute,
    private getCourseDetailUseCase: GetCourseDetailUseCase,
    private materialsService: MaterialsService,
    private evaluationsService: EvaluationsIntegrationService
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.params['id'] || '1';
    this.loadCourseData();
  }

  loadCourseData(): void {
    this.getCourseDetailUseCase.execute(this.courseId).subscribe({
      next: (data) => {
        this.course = data;
        console.log('📚 Detalle de curso cargado:', this.course);
        // Cargar materiales y evaluaciones desde backend
        this.loadMaterials();
        this.loadQuizzes();
        this.loadQuizAttempts();
      },
      error: (err) => {
        console.error('❌ Error al cargar datos del curso:', err);
        console.error('Verifique que el backend esté corriendo y que existan datos para el curso:', this.courseId);
      },
    });
  }

  loadMaterials(): void {
    this.materialsService.getMaterialsByCourse(this.courseId).subscribe({
      next: (materials) => {
        this.course.materials = materials;
        console.log('📋 Materiales cargados:', materials.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar materiales:', err);
        this.course.materials = [];
      }
    });
  }

  loadQuizzes(): void {
    this.evaluationsService.getEvaluationsByCourse(this.courseId).subscribe({
      next: (quizzes) => {
        this.quizzes.set(quizzes);
        console.log('📋 Evaluaciones cargadas:', quizzes.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar evaluaciones:', err);
        this.quizzes.set([]);
      }
    });
  }

  loadQuizAttempts(): void {
    // TODO: Obtener ID del estudiante del servicio de autenticación
    const studentId = 'student-1'; // Temporal
    this.evaluationsService.getQuizAttempts(studentId, this.courseId).subscribe({
      next: (attempts) => {
        this.quizAttempts.set(attempts);
        console.log('📋 Intentos de evaluaciones cargados:', attempts.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar intentos:', err);
        this.quizAttempts.set([]);
      }
    });
  }

  // ========== MATERIALES ==========
  // Signals para tab Materiales
  activeFilter = signal<MaterialType | 'all'>('all');
  searchQuery = signal('');

  // Tipos de materiales para filtros
  materialTypes: MaterialType[] = ['video', 'pdf', 'code', 'link', 'document'];

  // Computed: materiales filtrados
  // TODO: Los materiales actualmente vienen vacíos del backend - implementar en CoursesHttpRepositoryImpl
  filteredMaterials = computed(() => {
    let materials = this.course.materials || [];

    // Filtrar por tipo
    if (this.activeFilter() !== 'all') {
      materials = materials.filter((m) => m.type === this.activeFilter());
    }

    // Filtrar por búsqueda
    const query = this.searchQuery().toLowerCase();
    if (query) {
      materials = materials.filter(
        (m) =>
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
  // Signals para evaluaciones
  quizzes = signal<Quiz[]>([]);
  quizAttempts = signal<QuizAttempt[]>([]);
  quizFilter = signal<'all' | 'pending' | 'completed'>('all');

  // Computed: quizzes con estado calculado
  quizSummaries = computed(() => {
    const quizzesList = this.quizzes();
    const attempts = this.quizAttempts();
    
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
        bestPercentage: bestAttempt?.percentage,
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
    const total = quizzesWithScores.reduce((sum, q) => sum + (q.bestPercentage || 0), 0);
    return total / quizzesWithScores.length;
  });

  completionPercentage = computed(() => {
    const total = this.quizSummaries().length;
    if (total === 0) return 0;
    return (this.completedQuizzesCount() / total) * 100;
  });

  // Signal para quiz activo
  activeQuiz = signal<Quiz | null>(null);
  isQuizActive = computed(() => this.activeQuiz() !== null);

  // Signal para resultados activos
  activeResults = signal<{ quiz: Quiz; attempt: QuizAttempt } | null>(null);
  isResultsActive = computed(() => this.activeResults() !== null);

  // Computed: próxima lección no completada
  nextLesson = computed(() => {
    if (!this.course.modules) return null;
    
    for (const module of this.course.modules) {
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

  startLesson(lesson: Lesson): void {
    if (lesson.isLocked) {
      return;
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

    // Marcar como completada si no lo estaba
    if (!lesson.isCompleted) {
      lesson.isCompleted = true;
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
    return (this.course.materials || []).filter((m) => m.type === type).length;
  }

  downloadMaterial(material: CourseMaterial): void {
    console.log('Downloading:', material.title);
    // Simular descarga
    window.open(material.url, '_blank');
  }

  previewMaterial(material: CourseMaterial): void {
    console.log('Previewing:', material.title);
    // Abrir en modal o nueva ventana
    window.open(material.url, '_blank');
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
    return this.course.materials?.some((m) => m.lessonId === lesson.id) || false;
  }

  getMaterialsForLesson(lessonId: string): CourseMaterial[] {
    return this.course.materials?.filter((m) => m.lessonId === lessonId) || [];
  }

  getTotalLessons(): number {
    return (
      this.course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
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
    // Buscar el quiz completo
    const quiz = this.quizzes().find(q => q.id === quizSummary.id);
    if (!quiz) {
      console.error('Quiz not found:', quizSummary.id);
      return;
    }

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

    // Abrir quiz
    this.activeQuiz.set(quiz);
  }

  // Manejar envío de quiz
  onQuizSubmit(attempt: QuizAttempt): void {
    console.log('Quiz submitted:', attempt);
    
    // Agregar attempt a la lista
    const currentAttempts = this.quizAttempts();
    this.quizAttempts.set([...currentAttempts, attempt]);

    // Obtener el quiz actual antes de cerrar
    const currentQuiz = this.activeQuiz();

    // Cerrar quiz
    this.activeQuiz.set(null);

    // Mostrar resultados
    if (currentQuiz) {
      this.activeResults.set({ quiz: currentQuiz, attempt });
    }

    // TODO: Guardar en backend
  }

  // Cancelar quiz
  onQuizCancel(): void {
    this.activeQuiz.set(null);
  }

  // Ver resultados
  viewQuizResults(quizSummary: QuizSummary): void {
    // Buscar el quiz completo
    const quiz = this.quizzes().find(q => q.id === quizSummary.id);
    if (!quiz) {
      console.error('Quiz not found:', quizSummary.id);
      return;
    }

    // Buscar el mejor intento
    const attempts = this.quizAttempts().filter(a => a.quizId === quizSummary.id && a.status === 'completed');
    const bestAttempt = attempts.reduce((best, current) => 
      !best || (current.percentage || 0) > (best.percentage || 0) ? current : best
    , null as QuizAttempt | null);

    if (!bestAttempt) {
      alert('No se encontraron intentos completados para esta evaluación.');
      return;
    }

    // Mostrar resultados
    this.activeResults.set({ quiz, attempt: bestAttempt });
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

  // Obtener color de calificación
  getScoreColor(percentage: number): string {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }
}
