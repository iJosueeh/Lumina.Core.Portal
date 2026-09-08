import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Resource, ResourceCategory } from '@features/student/domain/models/resource.model';
import { ResourcesRepository } from '@features/student/domain/repositories/resources.repository';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resources.component.html',
  styles: ``,
})
export class ResourcesComponent implements OnInit {
  searchQuery = '';
  private router = inject(Router);
  private resourcesRepository = inject(ResourcesRepository);

  categories: ResourceCategory[] = [
    {
      id: 'library',
      name: 'Biblioteca Digital',
      icon: 'book',
      description: 'Libros y papers académicos',
      count: 245,
    },
    {
      id: 'software',
      name: 'Software y Herramientas',
      icon: 'code',
      description: 'IDEs, frameworks y utilidades',
      count: 89,
    },
    {
      id: 'guides',
      name: 'Guías y Manuales',
      icon: 'document',
      description: 'Tutoriales paso a paso',
      count: 156,
    },
    {
      id: 'programs',
      name: 'Programas Académicos',
      icon: 'academic',
      description: 'Planes de estudio y syllabus',
      count: 42,
    },
    {
      id: 'support',
      name: 'Soporte Técnico',
      icon: 'support',
      description: 'Ayuda y documentación',
      count: 78,
    },
  ];

  featuredResources: Resource[] = [
    {
      id: 'lib-001',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      description:
        'Guía completa sobre principios de código limpio y buenas prácticas de programación.',
      category: 'BIBLIOGRAFÍA',
      type: 'book',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
      badge: 'Popular',
      isFeatured: true,
      uploadDate: new Date(2024, 4, 15),
    },
    {
      id: 'lib-002',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      description:
        'Patrones de diseño fundamentales para desarrollo de software orientado a objetos.',
      category: 'BIBLIOGRAFÍA',
      type: 'book',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      badge: 'Popular',
      isFeatured: true,
      uploadDate: new Date(2024, 4, 10),
    },
    {
      id: 'soft-001',
      title: 'Visual Studio Code & Extensiones Recomendadas',
      description: 'Paquete de extensiones y configuración recomendada para desarrollo web y .NET en Lumina.',
      category: 'HERRAMIENTAS',
      type: 'code',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400',
      badge: 'Popular',
      isFeatured: true,
      uploadDate: new Date(2024, 4, 1),
    },
  ];

  recentResources: Resource[] = [
    {
      id: 'guide-001',
      title: 'Guía de Inicio Rápido: Plataforma Académica Lumina',
      description: 'Manual paso a paso sobre cómo matricularte, entregar evaluaciones y consultar notas.',
      category: 'MANUALES',
      type: 'pdf',
      url: '#',
      isFeatured: false,
      uploadDate: new Date(2024, 4, 15),
    },
    {
      id: 'prog-001',
      title: 'Malla Curricular y Sílabos 2026',
      description: 'Compendio de planes de estudio, competencias por ciclo y prerrequisitos de cursos.',
      category: 'PLANES DE ESTUDIO',
      type: 'pdf',
      url: '#',
      isFeatured: false,
      uploadDate: new Date(2024, 3, 10),
    },
    {
      id: 'sup-001',
      title: 'Preguntas Frecuentes y Mesa de Ayuda TI',
      description: 'Canales de atención técnica, recuperación de credenciales y soporte de aula virtual.',
      category: 'SOPORTE',
      type: 'link',
      url: '#',
      isFeatured: false,
      uploadDate: new Date(2024, 3, 5),
    },
    {
      id: 'lib-003',
      title: 'Introduction to Algorithms',
      description: 'Texto completo sobre algoritmos y estructuras de datos.',
      category: 'BIBLIOGRAFÍA',
      type: 'book',
      url: '#',
      isFeatured: false,
      uploadDate: new Date(2024, 2, 20),
    },
  ];

  ngOnInit(): void {
    this.resourcesRepository.getFeaturedResources().subscribe({
      next: (featured) => {
        if (featured && featured.length > 0) {
          this.featuredResources = featured;
        }
      },
      error: (err) => console.warn('[Resources] Error fetching featured resources:', err)
    });

    this.resourcesRepository.getResources().subscribe({
      next: (resources) => {
        if (resources && resources.length > 0) {
          this.recentResources = resources.slice(0, 4);
        }
      },
      error: (err) => console.warn('[Resources] Error fetching recent resources:', err)
    });
  }

  search(): void {
    if (this.searchQuery.trim()) {
      // Navegar a una vista de búsqueda global (todas las categorías)
      this.router.navigate(['/student/resources/category', 'all'], {
        queryParams: { q: this.searchQuery },
      });
    }
  }

  navigateToCategory(category: ResourceCategory): void {
    this.router.navigate(['/student/resources/category', category.id]);
  }

  downloadResource(resource: Resource): void {
    console.log('Downloading:', resource.title);
    // Navegar al detalle del recurso
    this.router.navigate(['/student/resources/detail', resource.id]);
  }

  accessResource(resource: Resource): void {
    // Navegar al detalle del recurso
    this.router.navigate(['/student/resources/detail', resource.id]);
  }

  viewAllResources(): void {
    // Navegar a vista global de todos los recursos
    this.router.navigate(['/student/resources/category', 'all']);
  }

  getResourceIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: 'document',
      video: 'play',
      code: 'code',
      link: 'link',
      book: 'book',
    };
    return icons[type] || 'document';
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
}
