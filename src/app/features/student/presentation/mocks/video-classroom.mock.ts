import { Module } from '@features/student/domain/models/course-detail.model';
import {
  VideoLessonViewModel,
  VideoSectionViewModel,
} from '@features/student/domain/models/video-classroom.model';

interface MockVideoContent {
  description: string;
  summary: string;
  videoUrl: string;
  thumbnailUrl: string;
  keyPoints: string[];
}

const DEFAULT_VIDEO_URL = 'https://www.youtube.com/embed/tgbNymZ7vqY?rel=0';

const VIDEO_CONTENT_BY_LESSON: Record<string, MockVideoContent> = {
  l1: {
    description:
      'Introduccion al modulo y objetivos de aprendizaje. Revisa el contexto del tema, los conceptos clave y como se evaluara el avance.',
    summary: 'Panorama inicial del curso y de la seccion para alinear expectativas.',
    videoUrl: 'https://www.youtube.com/embed/zpOULjyy-n8?rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop',
    keyPoints: [
      'Objetivos del modulo y resultados esperados.',
      'Mapa general de temas y metodologia.',
      'Criterios de avance y recomendaciones iniciales.',
    ],
  },
  l2: {
    description:
      'Explicacion guiada paso a paso con ejemplos practicos. Toma notas de los patrones principales para aplicarlos en los ejercicios.',
    summary: 'Desarrollo aplicado con ejemplos concretos del tema principal.',
    videoUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=450&fit=crop',
    keyPoints: [
      'Buenas practicas para resolver casos comunes.',
      'Errores frecuentes y como evitarlos.',
      'Checklist de validaciones antes de continuar.',
    ],
  },
  l3: {
    description:
      'Cierre del bloque y repaso rapido. Incluye recomendaciones para reforzar el contenido antes de continuar con la siguiente seccion.',
    summary: 'Repaso, consolidacion y puente hacia la siguiente seccion.',
    videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4?rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=450&fit=crop',
    keyPoints: [
      'Resumen de conceptos clave del bloque.',
      'Autoevaluacion rapida de entendimiento.',
      'Preparacion para el siguiente modulo.',
    ],
  },
};

function durationToSeconds(duration: string): number {
  const match = duration.match(/(\d+)/);
  if (!match) {
    return 0;
  }
  return Number(match[1]) * 60;
}

function buildResources(moduleId: string, lessonId: string): Array<{ id: string; title: string; type: 'pdf' | 'zip' | 'link' | 'code'; url: string }> {
  return [
    {
      id: `${lessonId}-res-pdf`,
      title: 'Diapositivas de la leccion',
      type: 'pdf',
      url: `https://example.com/resources/${moduleId}/${lessonId}/slides.pdf`,
    },
    {
      id: `${lessonId}-res-link`,
      title: 'Lectura complementaria',
      type: 'link',
      url: `https://example.com/resources/${moduleId}/${lessonId}/reading`,
    },
  ];
}

function buildLessonDescription(moduleTitle: string, lessonTitle: string): string {
  return `Video del modulo ${moduleTitle}. Esta leccion desarrolla ${lessonTitle} con enfoque practico, recomendaciones y puntos clave para tu avance.`;
}

export function buildVideoSectionsMock(modules: Module[]): VideoSectionViewModel[] {
  return modules
    .map((module, sectionIndex) => {
      const videos: VideoLessonViewModel[] = (module.lessons || [])
        .filter((lesson) => lesson.type === 'video')
        .map((lesson, index) => {
          const mock = VIDEO_CONTENT_BY_LESSON[lesson.id];

          return {
            lessonId: lesson.id,
            moduleId: module.id,
            moduleTitle: module.title,
            title: lesson.title,
            duration: lesson.duration,
            durationSeconds: durationToSeconds(lesson.duration),
            description: mock?.description || lesson.description || buildLessonDescription(module.title, lesson.title),
            summary: mock?.summary || `Resumen de ${lesson.title}`,
            videoUrl: mock?.videoUrl || DEFAULT_VIDEO_URL,
            thumbnailUrl: mock?.thumbnailUrl || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=450&fit=crop',
            provider: 'youtube',
            captions: [
              {
                id: `${lesson.id}-caption-es`,
                language: 'es',
                url: `https://example.com/captions/${lesson.id}-es.vtt`,
                isDefault: true,
              },
            ],
            resources: buildResources(module.id, lesson.id),
            keyPoints: mock?.keyPoints || ['Punto clave 1', 'Punto clave 2'],
            isCompleted: lesson.isCompleted,
            isLocked: lesson.isLocked,
            order: index + 1,
          };
        });

      return {
        id: module.id,
        title: module.title,
        order: sectionIndex + 1,
        videos,
      };
    })
    .filter((section) => section.videos.length > 0);
}
