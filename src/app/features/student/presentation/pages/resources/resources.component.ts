import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Resource, ResourceCategory } from '@features/student/domain/models/resource.model';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resources.component.html',
  styles: ``,
})
export class ResourcesComponent implements OnInit {
  searchQuery = '';

  constructor(private router: Router) {}

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
      id: 'lib-010',
      title: 'Artificial Intelligence: A Modern Approach',
      description: 'Introducción completa a la inteligencia artificial.',
      category: 'BIBLIOGRAFÍA',
      type: 'book',
      url: '#',
      imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400',
      isFeatured: true,
      uploadDate: new Date(2024, 4, 1),
    },
  ];

  recentResources: Resource[] = [
    {
      id: 'lib-013',
      title: 'Python Crash Course',
      description: 'Introducción práctica a Python para principiantes.',
      category: 'BIBLIOGRAFÍA',
      type: 'book',
      url: '#',
      isFeatured: false,
      uploadDate: new Date(2024, 4, 15),
    },
    {
      id: 'lib-015',
      title: 'Learning React',
      description: 'Guía moderna para aprender React y desarrollo frontend.',
      category: 'BIBLIOGRAFÍA',
      type: 'book',
      url: '#',
      isFeatured: false,
      uploadDate: new Date(2024, 3, 10),
    },
    {
      id: 'lib-014',
      title: 'Web Development with Node and Express',
      description: 'Desarrollo web moderno con Node.js y Express.',
      category: 'BIBLIOGRAFÍA',
      type: 'book',
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
    // Cargar recursos desde el backend
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
