import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ResourceDetail } from '@features/student/domain/models/resource.model';
import { ResourcesRepository } from '@features/student/domain/repositories/resources.repository';
import { NotificationService } from '@shared/services/notification.service';
import {
  RESOURCE_CATEGORY_MAP,
  getResourceBadgeColor,
  getResourceEmoji,
  formatResourceDate,
  formatFileSize,
  mapResourceToDetail,
  loadMockResources,
  DEFAULT_RESOURCE_PLACEHOLDER,
} from '../resource.utils';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resource-detail.html',
  styleUrl: './resource-detail.css',
})
export class ResourceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private resourcesRepository = inject(ResourcesRepository);
  private notificationService = inject(NotificationService);


  // Signals
  resource = signal<ResourceDetail | null>(null);
  allResources = signal<ResourceDetail[]>([]);
  isLoading = signal(true);
  linkCopied = signal(false);
  isFavorite = signal(false);

  readonly defaultPlaceholder = DEFAULT_RESOURCE_PLACEHOLDER;

  // Computed
  relatedResources = computed(() => {
    const current = this.resource();
    if (!current) return [];

    return this.allResources()
      .filter((r) => r.id !== current.id && (r.category === current.category || r.type === current.type))
      .slice(0, 3);
  });

  categorySlug = computed(() => {
    const res = this.resource();
    if (!res) return 'all';
    const cat = res.category.toLowerCase();
    for (const [key, val] of Object.entries(RESOURCE_CATEGORY_MAP)) {
      if (val.toLowerCase() === cat || cat.includes(key)) return key;
    }
    return 'all';
  });

  ngOnInit(): void {
    this.loadAllResources();

    this.route.params.subscribe((params) => {
      const resourceId = params['resourceId'];
      if (resourceId) {
        this.loadResource(resourceId);
      }
    });
  }

  private loadAllResources(): void {
    this.resourcesRepository
      .getResources()
      .pipe(
        map((resources) => resources.map((r) => mapResourceToDetail(r))),
        switchMap((backendList) => {
          return loadMockResources(this.http).pipe(
            map((mockList) => {
              const backendIds = new Set(backendList.map((r) => r.id));
              const filteredMocks = mockList.filter((m) => !backendIds.has(m.id));
              return [...backendList, ...filteredMocks];
            })
          );
        }),
        catchError(() => loadMockResources(this.http))
      )
      .subscribe({
        next: (resources) => {
          this.allResources.set(resources);
        },
        error: (err) => console.warn('[ResourceDetail] Error loading related resources:', err),
      });
  }

  loadResource(id: string): void {
    this.isLoading.set(true);

    this.resourcesRepository
      .getResources()
      .pipe(
        map((backendList) => {
          const match = backendList.find((r) => r.id === id);
          return match ? mapResourceToDetail(match) : null;
        }),
        switchMap((foundInBackend) => {
          if (foundInBackend) return of(foundInBackend);
          return loadMockResources(this.http).pipe(
            map((mockList) => mockList.find((r) => r.id === id) || null)
          );
        }),
        catchError(() => {
          return loadMockResources(this.http).pipe(
            map((mockList) => mockList.find((r) => r.id === id) || null)
          );
        })
      )
      .subscribe({
        next: (found) => {
          if (found) {
            this.resource.set(found);
            this.checkFavoriteStatus(found.id);
          } else {
            const fallback = this.allResources().find((r) => r.id === id);
            if (fallback) {
              this.resource.set(fallback);
              this.checkFavoriteStatus(fallback.id);
            } else {
              this.resource.set(null);
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

  private checkFavoriteStatus(id: string): void {
    try {
      const favorites: string[] = JSON.parse(
        localStorage.getItem('lumina_favorite_resources') || '[]'
      );
      this.isFavorite.set(favorites.includes(id));
    } catch {
      this.isFavorite.set(false);
    }
  }

  toggleFavorite(): void {
    const current = this.resource();
    if (!current) return;
    try {
      let favorites: string[] = JSON.parse(
        localStorage.getItem('lumina_favorite_resources') || '[]'
      );
      if (favorites.includes(current.id)) {
        favorites = favorites.filter((f) => f !== current.id);
        this.isFavorite.set(false);
      } else {
        favorites.push(current.id);
        this.isFavorite.set(true);
      }
      localStorage.setItem('lumina_favorite_resources', JSON.stringify(favorites));
    } catch {
      this.isFavorite.update((v) => !v);
    }
  }

  downloadResource(): void {
    const res = this.resource();
    if (res && res.url && res.url !== '#') {
      window.open(res.url, '_blank');
    } else {
      this.notificationService.show('info', 'El enlace de descarga o acceso externo no está disponible para este recurso.');
    }
  }

  shareResource(): void {
    if (navigator.share && this.resource()) {
      navigator
        .share({
          title: this.resource()?.title,
          text: this.resource()?.description,
          url: window.location.href,
        })
        .catch(() => this.copyToClipboard());
    } else {
      this.copyToClipboard();
    }
  }

  private copyToClipboard(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2500);
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.defaultPlaceholder) {
      img.src = this.defaultPlaceholder;
    }
  }

  goToRelated(resourceId: string): void {
    this.router.navigate(['/student/resources/detail', resourceId]);
  }

  goBack(): void {
    this.router.navigate(['/student/resources']);
  }

  // Shared helpers
  getBadgeClass(type: string): string {
    return getResourceBadgeColor(type);
  }

  getEmoji(type: string): string {
    return getResourceEmoji(type);
  }

  formatDate(date: Date | string | undefined | null): string {
    return formatResourceDate(date);
  }

  formatSize(size: number | string | undefined | null): string {
    return formatFileSize(size);
  }
}
