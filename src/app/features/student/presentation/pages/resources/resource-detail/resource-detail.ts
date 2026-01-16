import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceDetail } from '@features/student/domain/models/resource.model';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resource-detail.html',
  styleUrl: './resource-detail.css',
})
export class ResourceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Signals
  resource = signal<ResourceDetail | null>(null);
  allResources = signal<ResourceDetail[]>([]);
  isLoading = signal(true);

  // Computed
  relatedResources = computed(() => {
    const current = this.resource();
    if (!current) return [];

    return this.allResources()
      .filter((r) => r.id !== current.id && r.category === current.category)
      .slice(0, 3);
  });

  ngOnInit(): void {
    // Cargar todos los recursos primero
    this.http
      .get<ResourceDetail[]>('/assets/mock-data/resources/resources-detail.json')
      .pipe(
        map((resources) =>
          resources.map((r) => ({
            ...r,
            uploadDate: new Date(r.uploadDate),
            publishDate: r.publishDate ? new Date(r.publishDate) : new Date(r.uploadDate),
            lastUpdated: r.lastUpdated ? new Date(r.lastUpdated) : new Date(r.uploadDate),
          })),
        ),
      )
      .subscribe({
        next: (resources) => {
          this.allResources.set(resources);
        },
        error: (err) => {
          console.error('Error loading resources:', err);
        },
      });

    this.route.params.subscribe((params) => {
      const resourceId = params['resourceId'];
      this.loadResource(resourceId);
    });
  }

  loadResource(id: string): void {
    this.http
      .get<ResourceDetail[]>('/assets/mock-data/resources/resources-detail.json')
      .pipe(
        map((resources) =>
          resources
            .map((r) => ({
              ...r,
              uploadDate: new Date(r.uploadDate),
              publishDate: r.publishDate ? new Date(r.publishDate) : new Date(r.uploadDate),
              lastUpdated: r.lastUpdated ? new Date(r.lastUpdated) : new Date(r.uploadDate),
            }))
            .find((r) => r.id === id),
        ),
      )
      .subscribe({
        next: (found) => {
          if (found) {
            this.resource.set(found);
          } else {
            console.error('Resource not found:', id);
            this.router.navigate(['/student/resources']);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading resource:', err);
          this.isLoading.set(false);
        },
      });
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
      // Fallback or alert
      alert('Link copiado al portapapeles!');
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
