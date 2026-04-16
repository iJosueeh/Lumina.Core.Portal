import {
  DataIntegracionViewModel,
  VideoClassroomApiResponse,
  VideoClassroomData,
} from './video-classroom.api.model';

export function mapVideoClassroomResponse(api: VideoClassroomApiResponse): VideoClassroomData {
  return {
    courseId: api.courseId,
    courseTitle: api.courseTitle,
    courseDescription: api.courseDescription,
    courseImageUrl: api.courseImageUrl,
    progressPercent: api.progressPercent,
    totalLessons: api.totalLessons,
    completedLessons: api.completedLessons,
    pendingEvaluations: api.pendingEvaluations,
    sections: (api.sections || []).map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order,
      videos: (section.videos || []).map((video) => ({
        lessonId: video.lessonId,
        moduleId: video.moduleId,
        moduleTitle: video.moduleTitle,
        title: video.title,
        duration: video.duration,
        durationSeconds: video.durationSeconds,
        description: video.description,
        summary: video.summary,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        provider: normalizeProvider(video.provider),
        captions: (video.captions || []).map((caption) => ({
          id: caption.id,
          language: caption.language,
          url: caption.url,
          isDefault: caption.isDefault,
        })),
        resources: (video.resources || []).map((resource) => ({
          id: resource.id,
          title: resource.title,
          type: normalizeResourceType(resource.type),
          url: resource.url,
        })),
        keyPoints: video.keyPoints || [],
        isCompleted: !!video.isCompleted,
        isLocked: !!video.isLocked,
        order: video.order,
      })),
    })),
    dataIntegracion: mapDataIntegracion(api),
  };
}

function mapDataIntegracion(api: VideoClassroomApiResponse): DataIntegracionViewModel | null {
  if (!api.dataIntegracion) {
    return null;
  }

  return {
    minioActivo: !!api.dataIntegracion.minioActivo,
    storageProvider: api.dataIntegracion.storageProvider || 'unknown',
    totalMateriales: api.dataIntegracion.totalMateriales || 0,
    materialesDesdeMinio: api.dataIntegracion.materialesDesdeMinio || 0,
    mcpActivos: api.dataIntegracion.mcpActivos || [],
    generatedAtUtc: api.dataIntegracion.generatedAtUtc || new Date().toISOString(),
  };
}

function normalizeProvider(provider: string): 'youtube' | 'vimeo' | 'internal' {
  const normalized = (provider || '').toLowerCase();
  if (normalized === 'youtube') return 'youtube';
  if (normalized === 'vimeo') return 'vimeo';
  return 'internal';
}

function normalizeResourceType(type: string): 'pdf' | 'zip' | 'link' | 'code' {
  const normalized = (type || '').toLowerCase();
  if (normalized === 'pdf') return 'pdf';
  if (normalized === 'zip') return 'zip';
  if (normalized === 'code') return 'code';
  return 'link';
}
