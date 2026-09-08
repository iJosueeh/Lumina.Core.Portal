import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ResourceDetail } from '@features/student/domain/models/resource.model';
import { ResourcesRepository } from '@features/student/domain/repositories/resources.repository';
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

type FilterType = 'all' | 'pdf' | 'video' | 'code' | 'link' | 'book';
type SortType = 'recent' | 'popular' | 'alphabetical';
type ViewMode = 'grid' | 'list';

interface FilterState {
  searchQuery: string;
  type: FilterType;
  sortBy: SortType;
  viewMode: ViewMode;
}

@Component({
  selector: 'app-resource-category',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './resource-category.html',
  styleUrl: './resource-category.css',
})
export class ResourceCategoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private resourcesRepository = inject(ResourcesRepository);

  // Signals
  categoryId = signal<string>('');
  allResources = signal<ResourceDetail[]>([]);
  isLoading = signal(true);

  readonly defaultPlaceholder = DEFAULT_RESOURCE_PLACEHOLDER;

  filters = signal<FilterState>({
    searchQuery: '',
    type: 'all',
    sortBy: 'recent',
    viewMode: 'grid',
  });

  // Computed
  categoryName = computed(() => {
    const id = (this.categoryId() || '').toLowerCase();
    return RESOURCE_CATEGORY_MAP[id] || (id === 'all' ? 'Todos los Recursos' : 'Centro de Recursos');
  });

  stats = computed(() => {
    const resources = this.filteredResources();
    return {
      total: resources.length,
      pdf: resources.filter((r) => r.type === 'pdf').length,
      video: resources.filter((r) => r.type === 'video').length,
      book: resources.filter((r) => r.type === 'book').length,
      code: resources.filter((r) => r.type === 'code').length,
    };
  });

  filteredResources = computed(() => {
    let resources = this.allResources();
    const { searchQuery, type, sortBy } = this.filters();
    const query = searchQuery.toLowerCase().trim();
    const catId = (this.categoryId() || '').toLowerCase();

    // 1. Filter by Category
    if (catId && catId !== 'all') {
      const targetName = (RESOURCE_CATEGORY_MAP[catId] || catId).toLowerCase();
      resources = resources.filter((r) => {
        const resourceCat = (r.category || '').toLowerCase();
        return (
          resourceCat.includes(targetName) ||
          targetName.includes(resourceCat) ||
          resourceCat === catId ||
          (catId === 'library' && resourceCat.includes('biblioteca')) ||
          (catId === 'software' && resourceCat.includes('software')) ||
          (catId === 'guides' && (resourceCat.includes('guía') || resourceCat.includes('guia') || resourceCat.includes('manual'))) ||
          (catId === 'programs' && (resourceCat.includes('programa') || resourceCat.includes('académ'))) ||
          (catId === 'support' && (resourceCat.includes('soporte') || resourceCat.includes('técnic')))
        );
      });
    }

    // 2. Filter by Type
    if (type !== 'all') {
      resources = resources.filter((r) => r.type === type);
    }

    // 3. Filter by Search
    if (query) {
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          (r.author && r.author.name && r.author.name.toLowerCase().includes(query)) ||
          (r.tags && r.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // 4. Sort
    resources = [...resources].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return (b.uploadDate?.getTime() || 0) - (a.uploadDate?.getTime() || 0);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return resources;
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.categoryId.set(params['categoryId'] || 'all');
      this.loadResources();
    });

    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams['q']) {
        this.filters.update((f) => ({ ...f, searchQuery: queryParams['q'] }));
      }
    });
  }

  loadResources(): void {
    this.isLoading.set(true);
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
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading resources:', err);
          this.isLoading.set(false);
        },
      });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.defaultPlaceholder) {
      img.src = this.defaultPlaceholder;
    }
  }

  // Template Methods
  setSearchQuery(query: string): void {
    this.filters.update((f) => ({ ...f, searchQuery: query }));
  }

  setTypeFilter(type: string): void {
    this.filters.update((f) => ({ ...f, type: type as FilterType }));
  }

  setSortBy(sortBy: SortType): void {
    this.filters.update((f) => ({ ...f, sortBy }));
  }

  toggleViewMode(): void {
    this.filters.update((f) => ({ ...f, viewMode: f.viewMode === 'grid' ? 'list' : 'grid' }));
  }

  goToDetail(resourceId: string): void {
    this.router.navigate(['/student/resources/detail', resourceId]);
  }

  goBack(): void {
    this.router.navigate(['/student/resources']);
  }

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
