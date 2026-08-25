import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { forkJoin, lastValueFrom } from 'rxjs';

import {
  Module,
  Lesson,
  CourseMaterial,
  Quiz,
  QuizAttempt,
  QuizSummary,
} from '../../../domain/models/course-detail.model';
import { QuizStatus } from '../../../domain/models/quiz.model';

import { GetCourseDetailUseCase } from '@features/student/application/use-cases/get-course-detail.usecase';
import { MaterialsService } from '@features/student/infrastructure/services/materials.service';
import { EvaluationsIntegrationService } from '@features/student/infrastructure/services/evaluations-integration.service';
import { ProgressStorageService } from '@features/student/infrastructure/services/progress-storage.service';
import { StudentProgressService } from '@features/student/infrastructure/services/student-progress.service';
import { EnrollmentService } from '@features/student/infrastructure/services/enrollment.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@shared/services/notification.service';

import { QuizTakeComponent } from '../../components/quiz-take/quiz-take.component';
import { QuizResultsComponent } from '../../components/quiz-results/quiz-results.component';
import { CourseHeroComponent } from '../../../../../shared/components/features/course-ui/course-hero/course-hero.component';
import { CourseDescriptionComponent } from './components/course-description/course-description.component';
import { CourseContentComponent } from './components/course-content/course-content.component';
import { CourseEvaluationsComponent } from './components/course-evaluations/course-evaluations.component';

import { FilePreviewModalComponent, SharedFileResource } from '../../../../../shared/components/features/file-viewer/file-preview-modal/file-preview-modal.component';
import { TabNavComponent } from '../../../../../shared/components/ui/tab-nav/tab-nav.component';
import { TabType } from '../../../../../shared/models/course-management.models';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
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
  private studentProgressService = inject(StudentProgressService);
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  activeTab = signal<TabType>('description');
  courseId = signal<string>('');
  studentId = signal<string>('');
  selectedMaterial = signal<CourseMaterial | null>(null);
  showMaterialPreview = signal(false);

  // Enrollment state
  isEnrolled = signal(false);
  isEnrolling = signal(false);
  enrollmentChecked = signal(false);

  tabs = [
    { id: 'description' as TabType, label: 'Descripción', icon: 'document' },
    { id: 'content' as TabType, label: 'Contenido', icon: 'book' },
    { id: 'evaluaciones' as TabType, label: 'Evaluaciones', icon: 'clipboard-document-check' },
  ];

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

  progressQuery = injectQuery(() => ({
    queryKey: ['student-progress', this.studentId(), this.courseId()],
    queryFn: () => lastValueFrom(this.studentProgressService.getCourseProgress(this.studentId(), this.courseId())),
    enabled: !!this.studentId() && !!this.courseId(),
    staleTime: 0, // Siempre fresco para reflejar completados reales
  }));

  isStartingQuizId = signal<string | null>(null);
  isViewingResultsId = signal<string | null>(null);
  isQuizActive = signal(false);
  activeQuiz = signal<any>(null);
  activeIntentoId = signal<string | null>(null);
  submittingQuiz = signal(false);
  isResultsActive = signal(false);
  activeResults = signal<any>(null);

  course = computed(() => {
    const base = this.courseQuery.data();
    const progress = this.progressQuery.data();
    if (!base) return undefined;

    // Cruzar: usar isCompleted real del estudiante si existe
    const realCompletedIds = new Set(progress?.completedLessonIds ?? []);

    const enrichedModules = base.modules.map(m => ({
      ...m,
      lessons: m.lessons?.map(l => ({
        ...l,
        isCompleted: realCompletedIds.has(l.id) || l.isCompleted,
      })) ?? [],
    }));

    // Recalcular progress y completedModules desde datos reales
    let totalLessons = 0;
    let completedLessons = 0;
    let completedModulesCount = 0;
    for (const mod of enrichedModules) {
      const modLessons = mod.lessons?.length ?? 0;
      const modCompleted = mod.lessons?.filter(l => l.isCompleted).length ?? 0;
      totalLessons += modLessons;
      completedLessons += modCompleted;
      if (modLessons > 0 && modCompleted === modLessons) completedModulesCount++;
    }

    return {
      ...base,
      modules: enrichedModules,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      completedModules: completedModulesCount,
    };
  });
  materials = computed(() => this.materialsQuery.data() ?? []);

  quizSummaries = computed<QuizSummary[]>(() => {
    const rawQuizzes = this.evaluationsQuery.data() ?? [];
    const attempts = this.attemptsQuery.data() ?? [];

    console.log('[CourseDetail] rawQuizzes count:', rawQuizzes.length);
    console.log('[CourseDetail] attempts count:', attempts.length);

    return rawQuizzes.map(quiz => {
      const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
      const bestAttempt = [...quizAttempts].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      const status = this.calculateQuizStatus(quiz, quizAttempts);
      const hasCompleted = quizAttempts.some(a => a.status === 'completed' && a.answers.length > 0);

      console.log(`[CourseDetail] RESULTADO FINAL: "${quiz.titulo || quiz.title}" → status=${status} | hasCompleted=${hasCompleted} | attempts=${quizAttempts.length}`);

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
        status,
        attemptsUsed: quizAttempts.length,
        attemptsAllowed: quiz.config.attemptsAllowed,
        bestScore: bestAttempt?.score,
        bestPercentage: bestAttempt?.percentage,
        passed: bestAttempt?.passed,
        hasCompletedAttempt: hasCompleted
      };
    });
  });

  // Pre-cache: pre-load all quiz questions when evaluations tab is active
  // This makes "Iniciar Test" feel instant — questions are already in cache
  quizDetailsQuery = injectQuery(() => ({
    queryKey: ['quiz-details', this.courseId()],
    queryFn: async () => {
      const quizzes = this.evaluationsQuery.data() ?? [];
      // Fetch all quiz questions in parallel — runs in background, cached for later
      const results = await Promise.allSettled(
        quizzes.map(q => lastValueFrom(this.evaluationsService.getEvaluacionConPreguntas(q.id)))
      );
      return results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);
    },
    enabled: computed(() => !!this.evaluationsQuery.data()?.length)
  }));

  private calculateQuizStatus(quiz: Quiz, attempts: QuizAttempt[]): QuizStatus {
    if (attempts.some(a => a.status === 'completed' && a.passed)) return 'completed';
    if (quiz.availableUntil && new Date() > quiz.availableUntil) return 'expired';
    if (attempts.length > 0) return 'in-progress';
    return 'not-started';
  }

  getQuizStatusLabel(status: string): string {
    console.log(`[getQuizStatusLabel] called with status="${status}"`);
    switch (status) {
      case 'completed':   return 'Completada';
      case 'in-progress': return 'En curso';
      case 'not-started': return 'No iniciada';
      case 'expired':     return 'Vencida';
      case 'pending':     return 'Pendiente';
      default:             return `?(${status})`;
    }
  }

  isLoadingCourse = computed(() => this.courseQuery.isLoading());
  hasError = computed(() => !!this.courseQuery.error());

  ngOnInit(): void {
    this.courseId.set(this.route.snapshot.params['id'] || '1');

    // Resolve studentId from userId
    const userId = this.authService.getUserId() || '';
    if (userId) {
      this.enrollmentService.getStudentIdByUserId(userId).subscribe(studentId => {
        this.studentId.set(studentId || '');

        // Check enrollment status
        if (this.studentId() && this.courseId()) {
          this.checkEnrollment();
        }
      });
    }
  }

  private checkEnrollment(): void {
    this.enrollmentService.isEnrolled(this.studentId(), this.courseId()).subscribe({
      next: (enrolled) => {
        this.isEnrolled.set(enrolled);
        this.enrollmentChecked.set(true);
      },
      error: () => {
        this.isEnrolled.set(false);
        this.enrollmentChecked.set(true);
      }
    });
  }

  async enrollInCourse(): Promise<void> {
    if (!this.studentId() || !this.courseId()) return;

    this.isEnrolling.set(true);
    try {
      await lastValueFrom(this.enrollmentService.enroll(this.studentId(), this.courseId()));
      this.isEnrolled.set(true);
      this.notificationService.show('success', '¡Te has matriculado exitosamente!');
    } catch (error) {
      this.notificationService.show('error', 'No se pudo completar la matrícula. Intenta de nuevo.');
    } finally {
      this.isEnrolling.set(false);
    }
  }

  handlePrimaryAction(): void {
    if (this.isEnrolled()) {
      this.continueCurrentLesson();
    } else {
      this.enrollInCourse();
    }
  }

  setTab(tab: TabType): void { this.activeTab.set(tab); }

  goBack(): void { this.router.navigate(['/student/dashboard']); }

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

  toggleLessonCompletion(data: { event: Event, lesson: Lesson }): void {
    data.event.stopPropagation();
    data.lesson.isCompleted = !data.lesson.isCompleted;
    this.progressStorage.saveLessonProgress(this.courseId(), this.studentId(), data.lesson.id, data.lesson.isCompleted);
  }

  openLesson(data: { module: Module, lesson: Lesson }): void {
    if (!this.isEnrolled()) {
      this.notificationService.show('info', 'Debes matricularte primero para acceder al contenido.');
      return;
    }
    if (data.lesson.isLocked) return;
    this.router.navigate(['/student/course', this.courseId(), 'learn', data.lesson.id], {
      queryParams: { moduleId: data.module.id }
    });
  }

  continueCurrentLesson(): void {
    const courseData = this.course();
    if (!courseData?.modules?.length) return;
    this.openLesson({ module: courseData.modules[0], lesson: courseData.modules[0].lessons[0] });
  }

  async startQuiz(quiz: QuizSummary): Promise<void> {
    this.isStartingQuizId.set(quiz.id);
    try {
      const studentId = this.studentId();
      if (!studentId) throw new Error('No student ID');

      // Create the attempt (always needed — no cache for this)
      const attemptRes = await lastValueFrom(this.evaluationsService.createQuizAttempt(quiz.id, studentId));
      this.activeIntentoId.set(attemptRes.intentoId);

      // Try to get quiz from pre-cached pool first (instant), fallback to API
      const cached = this.quizDetailsQuery.data()?.find(q => q.id === quiz.id);
      const fullQuiz = cached
        ?? await lastValueFrom(this.evaluationsService.getEvaluacionConPreguntas(quiz.id));

      this.activeQuiz.set(fullQuiz);
      this.isQuizActive.set(true);
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      this.isStartingQuizId.set(null);
    }
  }

  async onQuizSubmit(attempt: any): Promise<void> {
    this.submittingQuiz.set(true);
    try {
      const studentId = this.studentId();
      const intentoId = this.activeIntentoId();

      if (!studentId || !intentoId) {
        throw new Error('Missing studentId or intentoId');
      }

      const result = await lastValueFrom(
        this.evaluationsService.submitQuizAttempt(
          intentoId,
          attempt.answers,
          this.activeQuiz().totalPoints,
          studentId,
          attempt.timeSpent
        )
      );

      const completedAttempt = {
        ...attempt,
        id: result.intentoId,
        score: result.calificacion,
        percentage: result.calificacion,
        passed: result.calificacion >= 10.5
      };

      this.activeResults.set({ quiz: this.activeQuiz(), attempt: completedAttempt });
      this.isQuizActive.set(false);
      this.isResultsActive.set(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      this.submittingQuiz.set(false);
    }
  }

  async viewQuizResults(quiz: QuizSummary): Promise<void> {
    this.isViewingResultsId.set(quiz.id);
    try {
      const userId = this.authService.getUserId();
      if (!userId) { console.warn('[viewQuizResults] No userId'); return; }

      const studentId = await lastValueFrom(this.enrollmentService.getStudentIdByUserId(userId));
      if (!studentId) { console.warn('[viewQuizResults] No studentId for userId:', userId); return; }

      const courseId = this.courseId();
      if (!courseId) return;

      // forkJoin: quiz con preguntas + intentos del estudiante en paralelo
      const results = await lastValueFrom(
        forkJoin({
          quiz: this.evaluationsService.getEvaluacionConPreguntas(quiz.id),
          attempts: this.evaluationsService.getQuizAttempts(studentId, courseId)
        })
      );
      const fullQuiz = results.quiz;
      const attempts = results.attempts;

      console.log('[viewQuizResults] quiz.id:', quiz.id, '| quiz.status:', quiz.status, '| quiz.attemptsUsed:', quiz.attemptsUsed, '| attempts:', attempts.length, '| first attempt:', attempts[0]);

      // Último intento completado de este quiz
      const completedAttempt = attempts
        .filter((a: QuizAttempt) => a.quizId === quiz.id && a.status === 'completed')
        .sort((a: QuizAttempt, b: QuizAttempt) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

      console.log('[viewQuizResults] completedAttempt:', completedAttempt, '| all statuses:', attempts.map(a => ({ id: a.id, quizId: a.quizId, status: a.status })));

      if (!completedAttempt) {
        console.warn('[viewQuizResults] No completed attempt found for quiz:', quiz.id, '| available attempts:', attempts.map((a: QuizAttempt) => ({ id: a.id, quizId: a.quizId, status: a.status })));
        return;
      }

      this.activeResults.set({ quiz: fullQuiz, attempt: completedAttempt });
      this.isResultsActive.set(true);
    } catch (error) {
      console.error('[viewQuizResults] Error:', error);
    } finally {
      this.isViewingResultsId.set(null);
    }
  }
}
