import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceDetail } from '@features/student/domain/models/resource.model';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-category.html',
  styleUrl: './resource-category.css',
})
export class ResourceCategoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Signals
  categoryId = signal<string>('');
  allResources = signal<ResourceDetail[]>([]);

  filters = signal<FilterState>({
    searchQuery: '',
    type: 'all',
    sortBy: 'recent',
    viewMode: 'grid',
  });

  // Computed
  categoryName = computed(() => {
    const id = this.categoryId();
    const names: Record<string, string> = {
      biblioteca: 'Biblioteca Digital',
      videos: 'Videos Educativos',
      laboratorios: 'Laboratorios Virtuales',
    };
    return names[id] || 'Recursos';
  });

  stats = computed(() => {
    const resources = this.allResources();
    return {
      total: resources.length,
      pdf: resources.filter((r) => r.type === 'pdf').length,
      video: resources.filter((r) => r.type === 'video').length,
      book: resources.filter((r) => r.type === 'book').length,
    };
  });

  filteredResources = computed(() => {
    let resources = this.allResources();
    const { searchQuery, type, sortBy } = this.filters();
    const query = searchQuery.toLowerCase();

    // 1. Filter by Category (implicit in loading, but good to check if mixed)
    // Assuming backend returns only category resources, or we verify?
    // Current impl filters by loading ONE file for all. So we probably should filter by category if the JSON has mixed data?
    // The JSON seems to be 'resources-detail.json' which might contain mixed.
    // But let's assume we filter by ID passed in route.
    // Wait, the JSON loading logic below loads ALL.
    const catId = this.categoryId();
    if (catId) {
      // Filter by category if needed? The mock helper used to return strict list.
      // Let's assume resources have 'category' field matching catId?
      // ResourceDetail has 'category'.
      resources = resources.filter((r) => r.category === catId || catId === 'all'); // 'all' might not be a valid catId but just in case
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
          (r.author && r.author.name && r.author.name.toLowerCase().includes(query)),
      );
    }

    // 4. Sort
    resources = [...resources].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.uploadDate.getTime() - a.uploadDate.getTime();
        case 'popular':
          return b.views - a.views;
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
      this.categoryId.set(params['categoryId']);
      this.loadResources();
    });
  }

  loadResources(): void {
    this.http
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
      )
      .subscribe({
        next: (resources) => {
          this.allResources.set(resources);
        },
        error: (err) => {
          console.error('Error loading resources:', err);
        },
      });
  }

  // Template Methods
  setSearchQuery(query: string): void {
    this.filters.update((f) => ({ ...f, searchQuery: query }));
  }

  setTypeFilter(type: string): void {
    // Cast string to FilterType if valid
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

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
