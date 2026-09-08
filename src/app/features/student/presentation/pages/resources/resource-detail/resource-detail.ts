import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceDetail, Resource } from '@features/student/domain/models/resource.model';
import { ResourcesRepository } from '@features/student/domain/repositories/resources.repository';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resource-detail.html',
  styleUrl: './resource-detail.css',
  styles: `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
    .animate-scaleUp { animation: scaleUp 0.2s ease-out; }
  `
})
export class ResourceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private resourcesRepository = inject(ResourcesRepository);

  // Signals
  resource = signal<ResourceDetail | null>(null);
  allResources = signal<ResourceDetail[]>([]);
  isLoading = signal(true);
  linkCopied = signal(false);

  // Computed
  relatedResources = computed(() => {
    const current = this.resource();
    if (!current) return [];

    return this.allResources()
      .filter((r) => r.id !== current.id && (r.category === current.category || r.type === current.type))
      .slice(0, 3);
  });

  ngOnInit(): void {
    // 1. Cargar todos los recursos (backend + mock fallback) para "Recursos relacionados"
    this.resourcesRepository.getResources().pipe(
      map(resources => resources.map(r => this.mapResourceToDetail(r))),
      switchMap(backendList => {
        if (backendList && backendList.length > 0) return of(backendList);
        return this.loadMockResources();
      }),
      catchError(() => this.loadMockResources())
    ).subscribe({
      next: (resources) => {
        this.allResources.set(resources);
      },
      error: (err) => {
        console.warn('[ResourceDetail] Error loading related resources:', err);
      },
    });

    // 2. Escuchar cambios de ruta para cargar el recurso activo
    this.route.params.subscribe((params) => {
      const resourceId = params['resourceId'];
      if (resourceId) {
        this.loadResource(resourceId);
      }
    });
  }

  private loadMockResources() {
    return this.http
      .get<ResourceDetail[]>('assets/mock-data/resources/resources-detail.json')
      .pipe(
        map((resources) =>
          resources.map((r) => ({
            ...r,
            uploadDate: new Date(r.uploadDate),
            publishDate: r.publishDate ? new Date(r.publishDate) : new Date(r.uploadDate),
            lastUpdated: r.lastUpdated ? new Date(r.lastUpdated) : new Date(r.uploadDate),
          })),
        ),
        catchError(() => of([]))
      );
  }

  loadResource(id: string): void {
    this.isLoading.set(true);

    // Intentar buscar primero en el repositorio real (Backend API)
    this.resourcesRepository.getResources().pipe(
      map(backendList => {
        const match = backendList.find(r => r.id === id);
        return match ? this.mapResourceToDetail(match) : null;
      }),
      switchMap(foundInBackend => {
        if (foundInBackend) return of(foundInBackend);

        // Si no está en el backend, buscar en el archivo local de recursos
        return this.loadMockResources().pipe(
          map(mockList => mockList.find(r => r.id === id) || null)
        );
      }),
      catchError(() => {
        return this.loadMockResources().pipe(
          map(mockList => mockList.find(r => r.id === id) || null)
        );
      })
    ).subscribe({
      next: (found) => {
        if (found) {
          this.resource.set(found);
        } else {
          console.warn('[ResourceDetail] Resource not found:', id);
          // Si no se encuentra, creamos una vista de detalle con los datos disponibles o redirigimos
          const fallback = this.allResources().find(r => r.id === id);
          if (fallback) {
            this.resource.set(fallback);
          } else {
            this.router.navigate(['/student/resources']);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading resource:', err);
        this.isLoading.set(false);
      },
    });
  }

  private mapResourceToDetail(r: Resource): ResourceDetail {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category || 'General',
      type: (r.type as any) || 'document',
      url: r.url || '#',
      imageUrl: r.imageUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
      badge: r.badge || 'Académico',
      isFeatured: r.isFeatured || false,
      uploadDate: r.uploadDate ? new Date(r.uploadDate) : new Date(),
      publishDate: r.uploadDate ? new Date(r.uploadDate) : new Date(),
      lastUpdated: new Date(),
      downloads: 145,
      views: 420,
      rating: 4.8,
      tags: [r.category?.toLowerCase() || 'académico', r.type],
      format: (r.type || 'PDF').toUpperCase(),
      language: 'Español',
      fileSize: r.fileSize || '2.5 MB',
      author: {
        name: 'Plataforma Lumina',
        title: 'Recurso Académico',
        avatar: 'https://ui-avatars.com/api/?name=Lumina+Core&background=4f46e5&color=fff'
      },
      isFavorite: false
    };
  }

  downloadResource(): void {
    const resource = this.resource();
    if (resource) {
      window.open(resource.url, '_blank');
    }
  }

  // Actions
  goToRelated(resourceId: string): void {
    this.router.navigate(['/student/resources/detail', resourceId]);
  }

  toggleFavorite(): void {
    // Implement toggle logic or mock
    console.log('Toggle favorite');
  }

  isFavorite = signal(false);

  shareResource(): void {
    console.log('Share resource');
    // Mock share
    if (navigator.share) {
      navigator
        .share({
          title: this.resource()?.title,
          text: this.resource()?.description,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 2500);
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/student/resources']);
  }

  getResourceColor(type: string): string {
    const colors: Record<string, string> = {
      pdf: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      video: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      book: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      code: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      link: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getResourceIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: '📄',
      video: '🎥',
      link: '🔗',
      document: '📝',
      book: '📚',
      code: '💻',
    };
    return icons[type] || '📁';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
