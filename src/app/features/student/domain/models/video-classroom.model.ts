export interface VideoLessonViewModel {
  lessonId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  duration: string;
  durationSeconds: number;
  description: string;
  summary: string;
  videoUrl: string;
  thumbnailUrl: string;
  provider: 'youtube' | 'vimeo' | 'internal';
  captions: VideoCaptionViewModel[];
  resources: VideoResourceViewModel[];
  keyPoints: string[];
  isCompleted: boolean;
  isLocked: boolean;
  order: number;
}

export interface VideoSectionViewModel {
  id: string;
  title: string;
  order: number;
  videos: VideoLessonViewModel[];
}

export interface VideoCaptionViewModel {
  id: string;
  language: string;
  url: string;
  isDefault?: boolean;
}

export interface VideoResourceViewModel {
  id: string;
  title: string;
  type: 'pdf' | 'zip' | 'link' | 'code';
  url: string;
}
