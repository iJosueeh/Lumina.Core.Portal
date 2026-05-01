import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

// Services
import { VideoClassroomService } from '@features/student/infrastructure/services/video-classroom.service';

// Shared Components
import { ClassroomPlayerComponent } from '@shared/components/features/classroom/classroom-player/classroom-player.component';
import { ClassroomPlaylistComponent } from '@shared/components/features/classroom/classroom-playlist/classroom-playlist.component';
import { ClassroomResourcesComponent, ClassroomResource } from '@shared/components/features/classroom/classroom-resources/classroom-resources.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { AddContentModalComponent } from '../course-management/components/add-content-modal/add-content-modal.component';

@Component({
  selector: 'app-teacher-video-classroom',
  standalone: true,
  imports: [
    CommonModule, 
    ClassroomPlayerComponent, 
    ClassroomPlaylistComponent, 
    ClassroomResourcesComponent, 
    SkeletonLoaderComponent,
    AddContentModalComponent
  ],
  templateUrl: './video-classroom.component.html',
})
export class VideoClassroomComponent implements OnInit, OnDestroy {
  courseId = signal('');
  selectedLessonId = signal<string | null>(null);
  activeTab = signal<'resources' | 'description'>('resources');
  materialScope = signal<'lesson' | 'section' | 'course'>('lesson');
  showEditModal = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private videoClassroomService = inject(VideoClassroomService);

  classroomQuery = injectQuery(() => ({
    queryKey: ['teacher-course-preview', this.courseId()],
    queryFn: () => lastValueFrom(this.videoClassroomService.getCourseVideoClassroom(this.courseId())),
    enabled: !!this.courseId(),
    refetchOnWindowFocus: false,
  }));

  // Data Selectors
  classroomData = computed(() => this.classroomQuery.data());
  sections = computed(() => this.classroomData()?.sections || []);
  allLessons = computed(() => this.sections().flatMap(s => s.videos));
  isLoading = computed(() => this.classroomQuery.isPending());
  
  activeLesson = computed(() => {
    const all = this.allLessons();
    const selected = this.selectedLessonId();
    return all.find(v => v.lessonId === selected) || all[0] || null;
  });

  activeLessonIndex = computed(() => 
    this.allLessons().findIndex(l => l.lessonId === this.activeLesson()?.lessonId)
  );

  currentResources = computed<ClassroomResource[]>(() => {
    const scope = this.materialScope();
    const active = this.activeLesson();
    const allSec = this.sections();
    
    if (!active) return [];

    switch (scope) {
      case 'lesson':
        return active.resources || [];
      
      case 'section':
        const currentSection = allSec.find(s => s.videos.some(v => v.lessonId === active.lessonId));
        return currentSection?.videos.flatMap(v => v.resources || []) || [];
      
      case 'course':
        return allSec.flatMap(s => s.videos.flatMap(v => v.resources || []));
      
      default:
        return active.resources || [];
    }
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId.set(params['id'] || '');
      this.selectedLessonId.set(params['lessonId'] || null);
    });
  }

  ngOnDestroy(): void {}

  selectLesson(lesson: any): void {
    this.selectedLessonId.set(lesson.lessonId);
  }

  goBack(): void {
    this.router.navigate(['/teacher/courses']);
  }

  goToPrevious(): void {
    const idx = this.activeLessonIndex();
    if (idx > 0) this.selectLesson(this.allLessons()[idx - 1]);
  }

  goToNext(): void {
    const idx = this.activeLessonIndex();
    if (idx < this.allLessons().length - 1) this.selectLesson(this.allLessons()[idx + 1]);
  }
}
