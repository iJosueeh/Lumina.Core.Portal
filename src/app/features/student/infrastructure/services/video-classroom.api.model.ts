import { VideoSectionViewModel } from '@features/student/domain/models/video-classroom.model';

export interface ApiWrapper<T> {
  success: boolean;
  data: T;
}

export interface DataIntegracionViewModel {
  minioActivo: boolean;
  storageProvider: string;
  totalMateriales: number;
  materialesDesdeMinio: number;
  mcpActivos: string[];
  generatedAtUtc: string;
}

export interface VideoClassroomData {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  courseImageUrl: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  pendingEvaluations: number;
  sections: VideoSectionViewModel[];
  dataIntegracion: DataIntegracionViewModel | null;
}

export interface VideoClassroomApiResponse {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  courseImageUrl: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  pendingEvaluations: number;
  sections: VideoSectionApiResponse[];
  dataIntegracion?: DataIntegracionApiResponse;
}

export interface DataIntegracionApiResponse {
  minioActivo: boolean;
  storageProvider: string;
  totalMateriales: number;
  materialesDesdeMinio: number;
  mcpActivos: string[];
  generatedAtUtc: string;
}

export interface VideoSectionApiResponse {
  id: string;
  title: string;
  order: number;
  videos: VideoLessonApiResponse[];
}

export interface VideoLessonApiResponse {
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
  provider: string;
  captions: VideoCaptionApiResponse[];
  resources: VideoResourceApiResponse[];
  keyPoints: string[];
  isCompleted: boolean;
  isLocked: boolean;
  order: number;
}

export interface VideoCaptionApiResponse {
  id: string;
  language: string;
  url: string;
  isDefault: boolean;
}

export interface VideoResourceApiResponse {
  id: string;
  title: string;
  type: string;
  url: string;
}
