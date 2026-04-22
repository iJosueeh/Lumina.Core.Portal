import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

// Models
import {
  Module,
  Lesson,
  CourseMaterial,
  Quiz,
  QuizAttempt,
  QuizSummary,
} from '../../../domain/models/course-detail.model';

// Use Cases & Services
import { GetCourseDetailUseCase } from '@features/student/application/use-cases/get-course-detail.usecase';
import { MaterialsService } from '@features/student/infrastructure/services/materials.service';
import { EvaluationsIntegrationService } from '@features/student/infrastructure/services/evaluations-integration.service';
import { ProgressStorageService } from '@features/student/infrastructure/services/progress-storage.service';
import { AuthService } from '@core/services/auth.service';

// Components
import { QuizTakeComponent } from '../../components/quiz-take/quiz-take.component';
import { QuizResultsComponent } from '../../components/quiz-results/quiz-results.component';
import { CourseHeroComponent } from '../../../../../shared/components/features/course-ui/course-hero/course-hero.component';
import { CourseDescriptionComponent } from './components/course-description/course-description.component';
import { CourseContentComponent } from './components/course-content/course-content.component';
import { CourseEvaluationsComponent } from './components/course-evaluations/course-evaluations.component';

// Shared
import { FilePreviewModalComponent, SharedFileResource } from '../../../../../shared/components/features/file-viewer/file-preview-modal/file-preview-modal.component';
import { TabNavComponent } from '../../../../../shared/components/ui/tab-nav/tab-nav.component';
import { TabType } from '../../../../../shared/models/course-management.models';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule, 
    QuizTakeComponent, 
    QuizResultsComponent,
    CourseHeroComponent,
    CourseDescriptionComponent,
    CourseContentComponent,
    CourseEvaluationsComponent,
    FilePreviewModalComponent,
    TabNavComponent
  ],
  templateUrl: './course-detail.component.html',
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private getCourseDetailUseCase = inject(GetCourseDetailUseCase);
  private materialsService = inject(MaterialsService);
  private evaluationsService = inject(EvaluationsIntegrationService);
  private progressStorage = inject(ProgressStorageService);
  private authService = inject(AuthService);

  activeTab = signal<TabType>('description');
  courseId = signal<string>('');
  studentId = signal<string>('');
  selectedMaterial = signal<CourseMaterial | null>(null);
  showMaterialPreview = signal(false);

  tabs = [
    { id: 'description' as TabType, label: 'Descripción', icon: 'document' },
    { id: 'content' as TabType, label: 'Contenido', icon: 'book' },
    { id: 'evaluaciones' as TabType, label: 'Evaluaciones', icon: 'clipboard-document-check' },
  ];

  // TanStack Queries
  courseQuery = injectQuery(() => ({
    queryKey: ['course-detail', this.courseId()],
    queryFn: () => lastValueFrom(this.getCourseDetailUseCase.execute(this.courseId())),
    enabled: !!this.courseId(),
  }));

  materialsQuery = injectQuery(() => ({
    queryKey: ['course-materials', this.courseId()],
    queryFn: () => lastValueFrom(this.materialsService.getMaterialsByCourse(this.courseId())),
    enabled: !!this.courseId(),
  }));

  evaluationsQuery = injectQuery(() => ({
    queryKey: ['course-evaluations', this.courseId()],
    queryFn: () => lastValueFrom(this.evaluationsService.getEvaluationsByCourse(this.courseId())),
    enabled: !!this.courseId(),
  }));

  attemptsQuery = injectQuery(() => ({
    queryKey: ['course-attempts', this.studentId(), this.courseId()],
    queryFn: () => lastValueFrom(this.evaluationsService.getQuizAttempts(this.studentId(), this.courseId())),
    enabled: !!this.courseId() && !!this.studentId(),
  }));

  // Quiz State (simplified for Shell)
  loadingQuiz = signal(false);
  isQuizActive = signal(false);
  activeQuiz = signal<any>(null);
  submittingQuiz = signal(false);
  isResultsActive = signal(false);
  activeResults = signal<any>(null);

  course = computed(() => this.courseQuery.data());
  materials = computed(() => this.materialsQuery.data() ?? []);
  
  // Mapeo de Quiz[] a QuizSummary[]
  quizSummaries = computed<QuizSummary[]>(() => {
    const rawQuizzes = this.evaluationsQuery.data() ?? [];
    const attempts = this.attemptsQuery.data() ?? [];
    
    return rawQuizzes.map(quiz => {
      const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
      const bestAttempt = [...quizAttempts].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      
      return {
        id: quiz.id,
        title: quiz.title,
        moduleId: quiz.moduleId,
        moduleName: quiz.moduleName,
        difficulty: quiz.difficulty,
        totalQuestions: quiz.totalQuestions,
        totalPoints: quiz.totalPoints,
        timeLimit: quiz.config.timeLimit,
        availableFrom: quiz.availableFrom,
        availableUntil: quiz.availableUntil,
        status: this.calculateQuizStatus(quiz, quizAttempts),
        attemptsUsed: quizAttempts.length,
        attemptsAllowed: quiz.config.attemptsAllowed,
        bestScore: bestAttempt?.score,
        bestPercentage: bestAttempt?.percentage,
        passed: bestAttempt?.passed
      };
    });
  });
  
  private calculateQuizStatus(quiz: Quiz, attempts: QuizAttempt[]): any {
    if (attempts.some(a => a.status === 'completed' && (a.passed || false))) return 'completed';
    if (quiz.availableUntil && new Date() > quiz.availableUntil) return 'expired';
    if (attempts.length > 0) return 'in-progress';
    return 'not-started';
  }

  isLoadingCourse = computed(() => this.courseQuery.isLoading());
  hasError = computed(() => !!this.courseQuery.error());

  ngOnInit(): void {
    this.courseId.set(this.route.snapshot.params['id'] || '1');
    this.studentId.set(this.authService.getUserId() || '');
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }

  // Material Actions
  previewMaterial(material: CourseMaterial): void {
    this.selectedMaterial.set(material);
    this.showMaterialPreview.set(true);
  }

  closeMaterialPreview(): void {
    this.showMaterialPreview.set(false);
    this.selectedMaterial.set(null);
  }

  downloadMaterial(material: SharedFileResource): void {
    window.open(material.url, '_blank');
  }

  // Lesson Actions
  toggleLessonCompletion(data: { event: Event, lesson: Lesson }): void {
    data.event.stopPropagation();
    data.lesson.isCompleted = !data.lesson.isCompleted;
    this.progressStorage.saveLessonProgress(
      this.courseId(), 
      this.studentId(), 
      data.lesson.id, 
      data.lesson.isCompleted
    );
  }

  openLesson(data: { module: Module, lesson: Lesson }): void {
    if (data.lesson.isLocked) return;
    this.router.navigate(['/student/video-classroom', this.courseId()], {
      queryParams: { moduleId: data.module.id, lessonId: data.lesson.id }
    });
  }

  continueCurrentLesson(): void {
    const courseData = this.course();
    if (!courseData?.modules?.length) return;
    this.openLesson({ module: courseData.modules[0], lesson: courseData.modules[0].lessons[0] });
  }

  // Quiz Actions
  async startQuiz(quiz: QuizSummary) {
    this.loadingQuiz.set(true);
    try {
      const fullQuiz = await lastValueFrom(this.evaluationsService.getEvaluacionConPreguntas(quiz.id));
      this.activeQuiz.set(fullQuiz);
      this.isQuizActive.set(true);
    } finally {
      this.loadingQuiz.set(false);
    }
  }

  async onQuizSubmit(answers: any) {
    this.submittingQuiz.set(true);
    try {
      const result = await lastValueFrom(this.evaluationsService.submitQuizAttempt(
        this.activeQuiz().id, 
        answers, 
        this.activeQuiz().totalPoints, 
        this.studentId()
      ));
      this.activeResults.set({ quiz: this.activeQuiz(), attempt: result });
      this.isQuizActive.set(false);
      this.isResultsActive.set(true);
    } finally {
      this.submittingQuiz.set(false);
    }
  }

  viewQuizResults(_quiz: QuizSummary) {
    // Logic to show results if student has attempts
  }
}
