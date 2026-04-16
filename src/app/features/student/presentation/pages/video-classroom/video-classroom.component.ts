import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ProgressStorageService } from '@features/student/infrastructure/services/progress-storage.service';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@features/student/domain/services/layout.service';
import { VideoLessonViewModel } from '@features/student/domain/models/video-classroom.model';
import { VideoClassroomPlaylistComponent } from '../../components/video-classroom-playlist/video-classroom-playlist.component';
import { VideoClassroomService } from '@features/student/infrastructure/services/video-classroom.service';
import { VideoClassroomData } from '@features/student/infrastructure/services/video-classroom.api.model';

type MaterialScope = 'lesson' | 'section' | 'course';
type MaterialType = 'all' | 'pdf' | 'zip' | 'link' | 'code';

@Component({
  selector: 'app-video-classroom',
  standalone: true,
  imports: [CommonModule, VideoClassroomPlaylistComponent],
  templateUrl: './video-classroom.component.html',
})
export class VideoClassroomComponent implements OnInit, OnDestroy {
  private readonly materialScopeStorageKey = 'videoClassroom.material.scope';
  private readonly materialTypeStorageKey = 'videoClassroom.material.type';

  courseId = signal('');
  studentId = signal('');
  selectedLessonId = signal<string | null>(null);
  autoplayEnabled = signal(false);
  materialScope = signal<MaterialScope>('lesson');
  materialTypeFilter = signal<MaterialType>('all');

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private queryClient = injectQueryClient();
  private progressStorage = inject(ProgressStorageService);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private videoClassroomService = inject(VideoClassroomService);
  private sanitizer = inject(DomSanitizer);

  classroomQuery = injectQuery(() => ({
    queryKey: ['course-video-classroom', this.courseId()],
    queryFn: async () => {
      return await lastValueFrom(this.videoClassroomService.getCourseVideoClassroom(this.courseId()));
    },
    enabled: !!this.courseId(),
    staleTime: 5 * 60 * 1000,
  }));

  classroomData = computed<VideoClassroomData | undefined>(() => this.classroomQuery.data());
  videoSections = computed(() => this.classroomData()?.sections || []);
  allVideoLessons = computed(() => this.videoSections().flatMap((section) => section.videos));
  activeSection = computed(() => {
    const active = this.activeVideoLesson();
    if (!active) {
      return null;
    }

    return this.videoSections().find((section) =>
      section.videos.some((video) => video.lessonId === active.lessonId)
    ) || null;
  });
  activeSectionMaterials = computed(() => {
    const section = this.activeSection();
    if (!section) {
      return [];
    }

    const map = new Map<string, VideoLessonViewModel['resources'][number]>();
    for (const video of section.videos) {
      for (const resource of video.resources || []) {
        if (!map.has(resource.id)) {
          map.set(resource.id, resource);
        }
      }
    }

    return Array.from(map.values());
  });
  lessonMaterials = computed(() => this.activeVideoLesson()?.resources || []);
  courseMaterials = computed(() => {
    const map = new Map<string, VideoLessonViewModel['resources'][number]>();

    for (const lesson of this.allVideoLessons()) {
      for (const resource of lesson.resources || []) {
        if (!map.has(resource.id)) {
          map.set(resource.id, resource);
        }
      }
    }

    return Array.from(map.values());
  });
  displayedMaterials = computed(() => {
    const scope = this.materialScope();
    const raw =
      scope === 'section' ? this.activeSectionMaterials() : scope === 'course' ? this.courseMaterials() : this.lessonMaterials();
    const filter = this.materialTypeFilter();

    if (filter === 'all') {
      return raw;
    }

    return raw.filter((resource) => this.normalizeResourceType(resource.type) === filter);
  });
  displayedMaterialsTitle = computed(() => {
    const scope = this.materialScope();

    if (scope === 'section') {
      return 'Material de la seccion activa';
    }

    if (scope === 'course') {
      return 'Material del curso';
    }

    return 'Material de la leccion';
  });

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
  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const video = this.activeVideoLesson();
    if (!video || !video.videoUrl) {
      return null;
    }

    if (!this.isAllowedVideoUrl(video.videoUrl)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(video.videoUrl);
  });

  ngOnInit(): void {
    // Hide sidebar when entering full-screen video experience
    this.layoutService.hideSidebar();
    this.restoreMaterialPreferences();

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
    this.syncLessonProgress(video.lessonId, 0, video.durationSeconds, this.videoProgressPercent());
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

  async toggleActiveVideoCompletion(): Promise<void> {
    const active = this.activeVideoLesson();
    if (!active) {
      return;
    }

    const wasCompleted = active.isCompleted;
    const nextCompleted = !wasCompleted;

    const updated = this.setLessonCompletionById(active.lessonId, nextCompleted);
    if (!updated) {
      return;
    }

    try {
      await lastValueFrom(
        this.videoClassroomService.updateLessonCompletion(this.courseId(), active.lessonId, {
          isCompleted: nextCompleted,
          source: 'manual',
        })
      );

      const watchedPercent = nextCompleted ? 100 : this.videoProgressPercent();
      await lastValueFrom(
        this.videoClassroomService.updateLessonProgress(this.courseId(), active.lessonId, {
          positionSeconds: nextCompleted ? active.durationSeconds : 0,
          durationSeconds: active.durationSeconds,
          watchedPercent,
        })
      );
    } catch {
      // Rollback local optimistic toggle if backend persistence fails.
      this.setLessonCompletionById(active.lessonId, wasCompleted);
      return;
    }

    if (!wasCompleted && this.autoplayEnabled() && this.hasNextVideo()) {
      this.goToNextVideo();
    }
  }

  private syncLessonProgress(
    lessonId: string,
    positionSeconds: number,
    durationSeconds: number,
    watchedPercent: number
  ): void {
    void lastValueFrom(
      this.videoClassroomService.updateLessonProgress(this.courseId(), lessonId, {
        positionSeconds,
        durationSeconds,
        watchedPercent,
      })
    );
  }

  private setLessonCompletionById(lessonId: string, completed: boolean): boolean {
    const classroomData = this.classroomData();
    if (!classroomData?.sections?.length) {
      return false;
    }

    let found = false;

    const updatedData: VideoClassroomData = {
      ...classroomData,
      sections: classroomData.sections.map((section) => ({
        ...section,
        videos: section.videos.map((video) => {
          if (video.lessonId !== lessonId) {
            return video;
          }

          found = true;
          this.progressStorage.saveLessonProgress(this.courseId(), this.studentId(), lessonId, completed);
          return { ...video, isCompleted: completed };
        }),
      })),
    };

    if (!found) {
      return false;
    }

    this.queryClient.setQueryData(['course-video-classroom', this.courseId()], updatedData);
    return true;
  }

  private isAllowedVideoUrl(rawUrl: string): boolean {
    try {
      const parsed = new URL(rawUrl);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  onMaterialScopeChange(value: string): void {
    if (value === 'lesson' || value === 'section' || value === 'course') {
      this.materialScope.set(value);
      this.persistMaterialPreferences();
    }
  }

  onMaterialTypeFilterChange(value: string): void {
    if (value === 'all' || value === 'pdf' || value === 'zip' || value === 'link' || value === 'code') {
      this.materialTypeFilter.set(value);
      this.persistMaterialPreferences();
    }
  }

  getResourceTypeLabel(resourceType: string | null | undefined): string {
    const normalized = this.normalizeResourceType(resourceType);

    if (normalized === 'pdf') {
      return 'PDF';
    }

    if (normalized === 'zip') {
      return 'ZIP';
    }

    if (normalized === 'code') {
      return 'Codigo';
    }

    return 'Enlace';
  }

  shouldShowSectionSummary(): boolean {
    return this.materialScope() !== 'lesson';
  }

  shouldResourceDownload(resourceType: string | null | undefined): boolean {
    const normalized = this.normalizeResourceType(resourceType);
    return normalized === 'pdf' || normalized === 'zip';
  }

  getResourceActionLabel(resourceType: string | null | undefined): string {
    return this.shouldResourceDownload(resourceType) ? 'Descargar' : 'Abrir';
  }

  isResourceType(resourceType: string | null | undefined, expected: Exclude<MaterialType, 'all'>): boolean {
    return this.normalizeResourceType(resourceType) === expected;
  }

  private normalizeResourceType(resourceType: string | null | undefined): Exclude<MaterialType, 'all'> {
    const normalized = (resourceType || '').toLowerCase();

    if (normalized === 'pdf') {
      return 'pdf';
    }

    if (normalized === 'zip') {
      return 'zip';
    }

    if (normalized === 'code') {
      return 'code';
    }

    return 'link';
  }

  private restoreMaterialPreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const savedScope = window.localStorage.getItem(this.materialScopeStorageKey);
    if (savedScope === 'lesson' || savedScope === 'section' || savedScope === 'course') {
      this.materialScope.set(savedScope);
    }

    const savedType = window.localStorage.getItem(this.materialTypeStorageKey);
    if (savedType === 'all' || savedType === 'pdf' || savedType === 'zip' || savedType === 'link' || savedType === 'code') {
      this.materialTypeFilter.set(savedType);
    }
  }

  private persistMaterialPreferences(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.materialScopeStorageKey, this.materialScope());
    window.localStorage.setItem(this.materialTypeStorageKey, this.materialTypeFilter());
  }
}
