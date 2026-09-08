import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Resource, ResourceDetail } from '@features/student/domain/models/resource.model';

export const RESOURCE_CATEGORY_MAP: Record<string, string> = {
  library: 'Biblioteca Digital',
  biblioteca: 'Biblioteca Digital',
  software: 'Software y Herramientas',
  guides: 'Guías y Manuales',
  guias: 'Guías y Manuales',
  programs: 'Programas Académicos',
  programas: 'Programas Académicos',
  support: 'Soporte Técnico',
  soporte: 'Soporte Técnico',
  programacion: 'Programación',
  frontend: 'Frontend',
  backend: 'Backend',
  databases: 'Bases de Datos',
  all: 'Todos los Recursos',
};

export const RESOURCE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  video: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
  book: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  code: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  link: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
  document: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
};

export const RESOURCE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  video: '🎥',
  link: '🔗',
  document: '📝',
  book: '📚',
  code: '💻',
};

export const DEFAULT_RESOURCE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80';

export function getResourceBadgeColor(type: string): string {
  return RESOURCE_TYPE_COLORS[type?.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
}

export function getResourceEmoji(type: string): string {
  return RESOURCE_TYPE_ICONS[type?.toLowerCase()] || '📁';
}

export function formatResourceDate(date: Date | string | undefined | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatFileSize(size: number | string | undefined | null): string {
  if (!size) return '1.5 MB';
  if (typeof size === 'string') return size;
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

export function mapResourceToDetail(r: Resource): ResourceDetail {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category || 'General',
    type: (r.type as any) || 'document',
    url: r.url || '#',
    imageUrl: r.imageUrl || DEFAULT_RESOURCE_PLACEHOLDER,
    badge: r.badge || 'Académico',
    isFeatured: r.isFeatured || false,
    uploadDate: r.uploadDate ? new Date(r.uploadDate) : new Date(),
    publishDate: r.uploadDate ? new Date(r.uploadDate) : new Date(),
    lastUpdated: new Date(),
    downloads: 145,
    views: 420,
    rating: 4.8,
    tags: [r.category?.toLowerCase() || 'académico', r.type || 'recurso'],
    format: (r.type || 'PDF').toUpperCase(),
    language: 'Español',
    fileSize: r.fileSize || '2.5 MB',
    author: {
      name: 'Plataforma Lumina',
      title: 'Recurso Académico Institucional',
      avatar: 'https://ui-avatars.com/api/?name=Lumina+Core&background=6366f1&color=fff',
    },
    isFavorite: false,
  };
}

export function loadMockResources(http: HttpClient): Observable<ResourceDetail[]> {
  return http.get<ResourceDetail[]>('assets/mock-data/resources/resources-detail.json').pipe(
    map((resources) =>
      resources.map((r) => ({
        ...r,
        uploadDate: new Date(r.uploadDate),
        publishDate: r.publishDate ? new Date(r.publishDate) : new Date(r.uploadDate),
        lastUpdated: r.lastUpdated ? new Date(r.lastUpdated) : new Date(r.uploadDate),
        imageUrl: r.imageUrl || DEFAULT_RESOURCE_PLACEHOLDER,
      }))
    ),
    catchError(() => of([]))
  );
}
