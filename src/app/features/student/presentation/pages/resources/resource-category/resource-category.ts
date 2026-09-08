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

  private readonly categoryMap: Record<string, string> = {
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

  // Computed
  categoryName = computed(() => {
    const id = (this.categoryId() || '').toLowerCase();
    return this.categoryMap[id] || (id === 'all' ? 'Todos los Recursos' : 'Centro de Recursos');
  });

  stats = computed(() => {
    const resources = this.filteredResources();
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
    const query = searchQuery.toLowerCase().trim();
    const catId = (this.categoryId() || '').toLowerCase();

    // 1. Filter by Category
    if (catId && catId !== 'all') {
      const targetName = (this.categoryMap[catId] || catId).toLowerCase();
      resources = resources.filter((r) => {
        const resourceCat = (r.category || '').toLowerCase();
        return resourceCat.includes(targetName) || targetName.includes(resourceCat) || resourceCat === catId;
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
          (r.tags && r.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // 4. Sort
    resources = [...resources].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.uploadDate.getTime() - a.uploadDate.getTime();
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
