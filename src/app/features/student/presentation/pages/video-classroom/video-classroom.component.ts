import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

// Services
import { ProgressStorageService } from '@features/student/infrastructure/services/progress-storage.service';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@features/student/domain/services/layout.service';
import { VideoClassroomService } from '@features/student/infrastructure/services/video-classroom.service';

// Shared Classroom Components
import { ClassroomPlayerComponent } from '@shared/components/features/classroom/classroom-player/classroom-player.component';
import { ClassroomPlaylistComponent, ClassroomLesson } from '@shared/components/features/classroom/classroom-playlist/classroom-playlist.component';
import { ClassroomResourcesComponent, ClassroomResource } from '@shared/components/features/classroom/classroom-resources/classroom-resources.component';
import { ClassroomHeaderComponent } from '@shared/components/features/classroom/classroom-header/classroom-header.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-video-classroom',
  standalone: true,
  imports: [
    CommonModule, 
    ClassroomPlayerComponent, 
    ClassroomPlaylistComponent, 
    ClassroomResourcesComponent, 
    ClassroomHeaderComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './video-classroom.component.html',
})
export class VideoClassroomComponent implements OnInit, OnDestroy {
  courseId = signal('');
  studentId = signal('');
  selectedLessonId = signal<string | null>(null);
  autoplayEnabled = signal(false);
  activeTab = signal<'resources' | 'description'>('resources');
  materialScope = signal<'lesson' | 'section' | 'course'>('lesson');

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private queryClient = injectQueryClient();
  private progressStorage = inject(ProgressStorageService);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private videoClassroomService = inject(VideoClassroomService);

  classroomQuery = injectQuery(() => ({
    queryKey: ['course-video-classroom', this.courseId()],
    queryFn: () => lastValueFrom(this.videoClassroomService.getCourseVideoClassroom(this.courseId())),
    enabled: !!this.courseId(),
    retry: (failureCount, error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return false;
      }

      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  }));

  // Data Selectors
  classroomData = computed(() => this.classroomQuery.data());
  sections = computed(() => this.classroomData()?.sections || []);
  allLessons = computed(() => this.sections().flatMap(s => s.videos));
  queryError = computed(() => this.classroomQuery.error());
  isCourseUnavailable = computed(() => {
    const error = this.queryError();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  isVideoUnavailable = computed(() => {
    const lesson = this.activeLesson();
    return !lesson || !lesson.videoUrl || !lesson.videoUrl.trim();
  });
  emptyStateTitle = computed(() =>
    this.isCourseUnavailable() ? 'Aula de video no disponible' : 'No se pudo cargar el curso'
  );
  emptyStateDescription = computed(() =>
    this.isCourseUnavailable()
      ? 'Este curso todavía no tiene aula de video habilitada o no existe. Puedes volver al curso e intentarlo más tarde.'
      : 'Ocurrió un error al obtener la información de las lecciones. Por favor, intenta de nuevo.'
  );
  
  activeLesson = computed(() => {
    const all = this.allLessons();
    const selected = this.selectedLessonId();
    return all.find(v => v.lessonId === selected) || all[0] || null;
  });

  activeLessonIndex = computed(() => 
    this.allLessons().findIndex(l => l.lessonId === this.activeLesson()?.lessonId)
  );

  // Material Logic
  currentResources = computed<ClassroomResource[]>(() => {
    const scope = this.materialScope();
    const active = this.activeLesson();
    if (!active) return [];

    if (scope === 'lesson') return active.resources || [];
    
    if (scope === 'section') {
      const section = this.sections().find(s => s.videos.some(v => v.lessonId === active.lessonId));
      return section ? section.videos.flatMap(v => v.resources || []) : [];
    }

    return this.allLessons().flatMap(v => v.resources || []);
  });

  // Progress Stats
  progressPercent = computed(() => {
    const lessons = this.allLessons();
    if (lessons.length === 0) return 0;
    const completed = lessons.filter(l => l.isCompleted).length;
    return Math.round((completed / lessons.length) * 100);
  });

  ngOnInit(): void {
    this.layoutService.hideSidebar();
    this.studentId.set(this.authService.getUserId() || '');
    this.route.params.subscribe(params => {
      this.courseId.set(params['id'] || '');
      this.selectedLessonId.set(params['lessonId'] || null);
    });
  }

  ngOnDestroy(): void {
    this.layoutService.showSidebar();
  }

  // Event Handlers
  selectLesson(lesson: any): void {
    const lessonId = lesson.lessonId;
    this.selectedLessonId.set(lessonId);
    this.router.navigate(['/student/course', this.courseId(), 'learn', lessonId]);
  }

  async toggleLessonCompletion(lesson: ClassroomLesson): Promise<void> {
    const nextState = !lesson.isCompleted;
    this.updateLocalProgress(lesson.lessonId, nextState);
    
    try {
      await lastValueFrom(this.videoClassroomService.updateLessonCompletion(this.courseId(), lesson.lessonId, {
        isCompleted: nextState,
        source: 'manual'
      }));
    } catch {
      this.updateLocalProgress(lesson.lessonId, !nextState);
    }
  }

  private updateLocalProgress(lessonId: string, completed: boolean): void {
    const data = this.classroomData();
    if (!data) return;

    const updated = {
      ...data,
      sections: data.sections.map(s => ({
        ...s,
        videos: s.videos.map(v => v.lessonId === lessonId ? { ...v, isCompleted: completed } : v)
      }))
    };

    this.queryClient.setQueryData(['course-video-classroom', this.courseId()], updated);
    this.progressStorage.saveLessonProgress(this.courseId(), this.studentId(), lessonId, completed);
  }

  goBack(): void {
    this.router.navigate(['/student/course', this.courseId()]);
  }

  goToPrevious(): void {
    const idx = this.activeLessonIndex();
    if (idx > 0) this.selectLesson(this.allLessons()[idx - 1]);
  }

  goToNext(): void {
    const idx = this.activeLessonIndex();
    if (idx < this.allLessons().length - 1) this.selectLesson(this.allLessons()[idx + 1]);
  }

  downloadResource(res: ClassroomResource): void {
    window.open(res.url, '_blank');
  }
}
