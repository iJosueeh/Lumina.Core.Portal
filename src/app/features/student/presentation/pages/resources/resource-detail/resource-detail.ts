import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceDetail } from '@features/student/domain/models/resource.model';
import { RESOURCES_DETAIL_MOCK } from '@features/student/domain/mocks/resources-detail.mock';

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

  // Signals
  resource = signal<ResourceDetail | null>(null);
  isFavorite = signal<boolean>(false);

  // Computed
  relatedResources = computed(() => {
    const current = this.resource();
    if (!current) return [];

    return RESOURCES_DETAIL_MOCK.filter(
      (r) => r.id !== current.id && r.category === current.category,
    ).slice(0, 3);
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const resourceId = params['resourceId'];
      this.loadResource(resourceId);
    });
  }

  loadResource(id: string): void {
    const found = RESOURCES_DETAIL_MOCK.find((r) => r.id === id);
    if (found) {
      this.resource.set(found);
      this.isFavorite.set(found.isFavorite || false);
    }
  }

  toggleFavorite(): void {
    this.isFavorite.update((v) => !v);
  }

  downloadResource(): void {
    const res = this.resource();
    if (!res) return;

    // Si es un enlace externo, abrir en nueva pestaña
    if (res.type === 'link') {
      window.open(res.url, '_blank');
      return;
    }

    // Para PDFs, videos, etc., simular descarga
    // En producción, esto haría una petición al backend
    console.log('Descargando:', res.title);

    // Simular descarga (en producción sería una petición HTTP)
    const link = document.createElement('a');
    link.href = res.url;
    link.download = `${res.title}.${res.format?.toLowerCase() || 'pdf'}`;
    link.click();
  }

  async shareResource(): Promise<void> {
    const res = this.resource();
    if (!res) return;

    const shareData = {
      title: res.title,
      text: res.description,
      url: window.location.href,
    };

    // Intentar usar Web Share API (móvil/navegadores modernos)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Usuario canceló o error
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copiar URL al portapapeles
      this.copyToClipboard(window.location.href);
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        alert('¡Enlace copiado al portapapeles!');
      },
      (err) => {
        console.error('Error al copiar:', err);
        alert('No se pudo copiar el enlace');
      },
    );
  }

  goToRelated(resourceId: string): void {
    this.router.navigate(['/student/resources/detail', resourceId]);
  }

  goBack(): void {
    const res = this.resource();
    if (res) {
      const categoryId = this.getCategoryId(res.category);
      this.router.navigate(['/student/resources/category', categoryId]);
    } else {
      this.router.navigate(['/student/resources']);
    }
  }

  getCategoryId(categoryName: string): string {
    const mapping: Record<string, string> = {
      'Biblioteca Digital': 'library',
      'Software y Herramientas': 'software',
      'Guías y Manuales': 'guides',
      'Programas Académicos': 'programs',
      'Soporte Técnico': 'support',
    };
    return mapping[categoryName] || 'library';
  }

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
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
