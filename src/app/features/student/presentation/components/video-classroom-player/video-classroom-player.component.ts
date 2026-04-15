import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoLessonViewModel } from '@features/student/domain/models/video-classroom.model';

@Component({
  selector: 'app-video-classroom-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-classroom-player.component.html',
})
export class VideoClassroomPlayerComponent {
  @Input() set video(value: VideoLessonViewModel | null) {
    this.videoState.set(value);
  }
  @Input() hasPrevious = false;
  @Input() hasNext = false;
  @Input() autoplayEnabled = false;
  @Input() completedVideos = 0;
  @Input() totalVideos = 0;
  @Input() progressPercent = 0;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() toggleComplete = new EventEmitter<void>();
  @Output() toggleAutoplay = new EventEmitter<void>();

  private sanitizer = inject(DomSanitizer);
  private videoState = signal<VideoLessonViewModel | null>(null);

  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const video = this.videoState();
    return video?.videoUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(video.videoUrl)
      : null;
  });

  currentVideo = computed(() => this.videoState());

  onPrevious(): void {
    this.previous.emit();
  }

  onNext(): void {
    this.next.emit();
  }

  onToggleComplete(): void {
    this.toggleComplete.emit();
  }

  onToggleAutoplay(): void {
    this.toggleAutoplay.emit();
  }
}
