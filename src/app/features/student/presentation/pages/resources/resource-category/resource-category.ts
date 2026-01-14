import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceDetail, ResourceFilter } from '@features/student/domain/models/resource.model';
import { RESOURCES_DETAIL_MOCK } from '@features/student/domain/mocks/resources-detail.mock';

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

  // Signals
  categoryId = signal<string>('');
  categoryName = signal<string>('');
  allResources = signal<ResourceDetail[]>([]);

  // Filtros
  filters = signal<ResourceFilter>({
    type: 'all',
    searchQuery: '',
    sortBy: 'recent',
    viewMode: 'grid',
  });

  // Recursos filtrados (computed)
  filteredResources = computed(() => {
    let resources = this.allResources();

    // Si no es búsqueda global ('all'), filtrar por categoría
    if (this.categoryId() !== 'all') {
      resources = resources.filter((r) => r.category === this.categoryName());
    }

    const currentFilters = this.filters();

    // Filtrar por tipo
    if (currentFilters.type && currentFilters.type !== 'all') {
      resources = resources.filter((r) => r.type === currentFilters.type);
    }

    // Filtrar por búsqueda
    if (currentFilters.searchQuery) {
      const query = currentFilters.searchQuery.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Ordenar
    switch (currentFilters.sortBy) {
      case 'recent':
        resources.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
        break;
      case 'popular':
        resources.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'alphabetical':
        resources.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return resources;
  });

  // Estadísticas (computed)
  stats = computed(() => ({
    total: this.filteredResources().length,
    pdf: this.filteredResources().filter((r) => r.type === 'pdf').length,
    video: this.filteredResources().filter((r) => r.type === 'video').length,
    code: this.filteredResources().filter((r) => r.type === 'code').length,
    link: this.filteredResources().filter((r) => r.type === 'link').length,
    book: this.filteredResources().filter((r) => r.type === 'book').length,
  }));

  ngOnInit(): void {
    // Cargar datos mock
    this.allResources.set(RESOURCES_DETAIL_MOCK);

    // Obtener categoryId de la ruta
    this.route.params.subscribe((params) => {
      const catId = params['categoryId'];
      this.categoryId.set(catId);
      this.categoryName.set(this.getCategoryName(catId));
    });

    // Obtener query params para búsqueda
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams['q']) {
        this.setSearchQuery(queryParams['q']);
      }
    });
  }

  getCategoryName(id: string): string {
    const categories: Record<string, string> = {
      all: 'Resultados de Búsqueda',
      library: 'Biblioteca Digital',
      software: 'Software y Herramientas',
      guides: 'Guías y Manuales',
      programs: 'Programas Académicos',
      support: 'Soporte Técnico',
    };
    return categories[id] || 'Recursos';
  }

  // Métodos de filtrado
  setTypeFilter(type: 'all' | 'pdf' | 'video' | 'code' | 'link' | 'book'): void {
    this.filters.update((f) => ({ ...f, type }));
  }

  setSearchQuery(query: string): void {
    this.filters.update((f) => ({ ...f, searchQuery: query }));
  }

  setSortBy(sortBy: 'recent' | 'popular' | 'alphabetical'): void {
    this.filters.update((f) => ({ ...f, sortBy }));
  }

  toggleViewMode(): void {
    this.filters.update((f) => ({
      ...f,
      viewMode: f.viewMode === 'grid' ? 'list' : 'grid',
    }));
  }

  // Navegación
  goToDetail(resourceId: string): void {
    this.router.navigate(['/student/resources/detail', resourceId]);
  }

  goBack(): void {
    this.router.navigate(['/student/resources']);
  }

  // Utilidades
  getResourceIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: '📄',
      video: '▶️',
      code: '💻',
      link: '🔗',
      book: '📚',
    };
    return icons[type] || '📄';
  }

  getResourceColor(type: string): string {
    const colors: Record<string, string> = {
      pdf: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      video: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      code: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      link: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      book: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}
