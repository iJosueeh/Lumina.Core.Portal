import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  VideoLessonViewModel,
  VideoSectionViewModel,
} from '@features/student/domain/models/video-classroom.model';

@Component({
  selector: 'app-video-classroom-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-classroom-playlist.component.html',
})
export class VideoClassroomPlaylistComponent {
  @Input() sections: VideoSectionViewModel[] = [];
  @Input() activeLessonId: string | null = null;

  @Output() selectVideo = new EventEmitter<VideoLessonViewModel>();

  onSelect(video: VideoLessonViewModel): void {
    this.selectVideo.emit(video);
  }

  getSectionResourcesCount(section: VideoSectionViewModel): number {
    return section.videos.reduce((acc, video) => acc + (video.resources?.length || 0), 0);
  }

  getLessonResourcesCount(video: VideoLessonViewModel): number {
    return video.resources?.length || 0;
  }
}
