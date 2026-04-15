import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { GetCourseDetailUseCase } from '@features/student/application/use-cases/get-course-detail.usecase';
import { ProgressStorageService } from '@features/student/infrastructure/services/progress-storage.service';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@features/student/domain/services/layout.service';
import { buildVideoSectionsMock } from '../../mocks/video-classroom.mock';
import { VideoLessonViewModel } from '@features/student/domain/models/video-classroom.model';
import { VideoClassroomPlaylistComponent } from '../../components/video-classroom-playlist/video-classroom-playlist.component';

@Component({
  selector: 'app-video-classroom',
  standalone: true,
  imports: [CommonModule, VideoClassroomPlaylistComponent],
  templateUrl: './video-classroom.component.html',
})
export class VideoClassroomComponent implements OnInit, OnDestroy {
  courseId = signal('');
  studentId = signal('');
  selectedLessonId = signal<string | null>(null);
  autoplayEnabled = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private queryClient = injectQueryClient();
  private getCourseDetailUseCase = inject(GetCourseDetailUseCase);
  private progressStorage = inject(ProgressStorageService);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);

  courseQuery = injectQuery(() => ({
    queryKey: ['course-detail', this.courseId()],
    queryFn: async () => {
      return await lastValueFrom(this.getCourseDetailUseCase.execute(this.courseId()));
    },
    enabled: !!this.courseId(),
    staleTime: 5 * 60 * 1000,
  }));

  course = computed(() => this.courseQuery.data());
  videoSections = computed(() => buildVideoSectionsMock(this.course()?.modules || []));
  allVideoLessons = computed(() => this.videoSections().flatMap((section) => section.videos));

  activeVideoLesson = computed<VideoLessonViewModel | null>(() => {
    const all = this.allVideoLessons();
    if (!all.length) {
      return null;
    }

    const selected = this.selectedLessonId();
    if (!selected) {
      return all[0];
    }

    return all.find((video) => video.lessonId === selected) || all[0];
  });

  activeVideoIndex = computed(() => {
    const active = this.activeVideoLesson();
    if (!active) {
      return -1;
    }

    return this.allVideoLessons().findIndex((video) => video.lessonId === active.lessonId);
  });

  hasPreviousVideo = computed(() => this.activeVideoIndex() > 0);
  hasNextVideo = computed(() => {
    const idx = this.activeVideoIndex();
    return idx >= 0 && idx < this.allVideoLessons().length - 1;
  });

  completedVideoCount = computed(() => this.allVideoLessons().filter((video) => video.isCompleted).length);
  videoProgressPercent = computed(() => {
    const total = this.allVideoLessons().length;
    if (!total) {
      return 0;
    }
    return Math.round((this.completedVideoCount() / total) * 100);
  });
  safeVideoUrl = computed(() => {
    const video = this.activeVideoLesson();
    if (!video || !video.videoUrl) {
      return null;
    }
    return video.videoUrl;
  });

  ngOnInit(): void {
    // Hide sidebar when entering full-screen video experience
    this.layoutService.hideSidebar();

    const userId = this.authService.getUserId();
    if (userId) {
      this.studentId.set(userId);
    }

    this.route.params.subscribe((params) => {
      this.courseId.set(params['id'] || '');
      this.selectedLessonId.set(params['lessonId'] || null);
    });
  }

  ngOnDestroy(): void {
    // Restore sidebar when leaving video classroom
    this.layoutService.showSidebar();
  }

  backToCourse(): void {
    this.router.navigate(['/student/course', this.courseId()]);
  }

  selectVideoLesson(video: VideoLessonViewModel): void {
    this.selectedLessonId.set(video.lessonId);
    this.router.navigate(['/student/course', this.courseId(), 'learn', video.lessonId]);
  }

  goToPreviousVideo(): void {
    const idx = this.activeVideoIndex();
    if (idx <= 0) {
      return;
    }

    const previous = this.allVideoLessons()[idx - 1];
    if (!previous || previous.isLocked) {
      return;
    }

    this.selectVideoLesson(previous);
  }

  goToNextVideo(): void {
    const idx = this.activeVideoIndex();
    const videos = this.allVideoLessons();
    if (idx < 0 || idx >= videos.length - 1) {
      return;
    }

    const next = videos[idx + 1];
    if (!next || next.isLocked) {
      return;
    }

    this.selectVideoLesson(next);
  }

  toggleAutoplay(): void {
    this.autoplayEnabled.update((value) => !value);
  }

  toggleActiveVideoCompletion(): void {
    const active = this.activeVideoLesson();
    if (!active) {
      return;
    }

    const wasCompleted = active.isCompleted;
    const updated = this.setLessonCompletionById(active.lessonId, !wasCompleted);
    if (!updated) {
      return;
    }

    if (!wasCompleted && this.autoplayEnabled() && this.hasNextVideo()) {
      this.goToNextVideo();
    }
  }

  private setLessonCompletionById(lessonId: string, completed: boolean): boolean {
    const courseData = this.course();
    if (!courseData?.modules) {
      return false;
    }

    const updatedCourse = { ...courseData };
    let found = false;

    updatedCourse.modules = courseData.modules.map((module) => {
      const updatedModule = { ...module };
      updatedModule.lessons = module.lessons?.map((lesson) => {
        if (lesson.id !== lessonId) {
          return lesson;
        }

        found = true;
        this.progressStorage.saveLessonProgress(this.courseId(), this.studentId(), lesson.id, completed);
        return { ...lesson, isCompleted: completed };
      });
      return updatedModule;
    });

    if (!found) {
      return false;
    }

    const totalLessons = updatedCourse.modules.reduce(
      (total, module) => total + (module.lessons?.length || 0),
      0,
    );
    const completedLessons = updatedCourse.modules.reduce(
      (total, module) => total + (module.lessons?.filter((lesson) => lesson.isCompleted).length || 0),
      0,
    );

    updatedCourse.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    updatedCourse.completedModules = updatedCourse.modules.filter(
      (module) => module.lessons?.length > 0 && module.lessons.every((lesson) => lesson.isCompleted),
    ).length;

    this.queryClient.setQueryData(['course-detail', this.courseId()], updatedCourse);
    return true;
  }
}
