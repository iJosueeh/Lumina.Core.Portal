import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Resource, ResourceCategory } from '@features/student/domain/models/resource.model';

@Component({
    selector: 'app-resources',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './resources.component.html',
    styles: ``
})
export class ResourcesComponent implements OnInit {
    searchQuery = '';

    categories: ResourceCategory[] = [
        {
            id: 'library',
            name: 'Biblioteca Digital',
            icon: 'book',
            description: 'Libros y papers académicos',
            count: 245
        },
        {
            id: 'software',
            name: 'Software y Herramientas',
            icon: 'code',
            description: 'IDEs, frameworks y utilidades',
            count: 89
        },
        {
            id: 'guides',
            name: 'Guías y Manuales',
            icon: 'document',
            description: 'Tutoriales paso a paso',
            count: 156
        },
        {
            id: 'programs',
            name: 'Programas Académicos',
            icon: 'academic',
            description: 'Planes de estudio y syllabus',
            count: 42
        },
        {
            id: 'support',
            name: 'Soporte Técnico',
            icon: 'support',
            description: 'Ayuda y documentación',
            count: 78
        }
    ];

    featuredResources: Resource[] = [
        {
            id: '1',
            title: 'Configuración de Entorno Python 3.11',
            description: 'Manual paso a paso para instalar Python y VS Code para el curso de Programación Orientada a Objetos.',
            category: 'GUÍA TÉCNICA',
            type: 'pdf',
            url: '#',
            imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
            badge: 'Popular',
            isFeatured: true,
            uploadDate: new Date(2024, 4, 15)
        },
        {
            id: '2',
            title: 'Clean Code: Manual de Estilo',
            description: 'Versión digital del libro clásico de Robert C. Martin. Normas de legibilidad y buenas prácticas.',
            category: 'BIBLIOGRAFÍA',
            type: 'pdf',
            url: '#',
            imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
            badge: 'Popular',
            isFeatured: true,
            uploadDate: new Date(2024, 4, 10)
        },
        {
            id: '3',
            title: 'Calendario Académico 2024',
            description: 'Fechas importantes, exámenes parciales, finales y días festivos.',
            category: 'ADMINISTRATIVO',
            type: 'pdf',
            url: '#',
            imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400',
            isFeatured: true,
            uploadDate: new Date(2024, 4, 1)
        }
    ];

    recentResources: Resource[] = [
        {
            id: '4',
            title: 'Reglamento Estudiantil 2024',
            description: 'Actualizado al 15 de Mayo - Normas de convivencia y evaluación.',
            category: 'ADMINISTRATIVO',
            type: 'pdf',
            url: '#',
            isFeatured: false,
            uploadDate: new Date(2024, 4, 15)
        },
        {
            id: '5',
            title: 'Tutorial: Git & Github para principiantes',
            description: 'Video tutorial dirigido de taller del 10 de Abril.',
            category: 'TUTORIAL',
            type: 'video',
            url: '#',
            isFeatured: false,
            uploadDate: new Date(2024, 3, 10)
        },
        {
            id: '6',
            title: 'Plantillas de Proyectos Java',
            description: 'Código base para los laboratorios de Programación Orientada a Objetos.',
            category: 'CÓDIGO',
            type: 'code',
            url: '#',
            isFeatured: false,
            uploadDate: new Date(2024, 3, 5)
        },
        {
            id: '7',
            title: 'Acceso a O\'Reilly Books',
            description: 'Enlace directo a la biblioteca digital licenciada por la universidad.',
            category: 'BIBLIOTECA',
            type: 'link',
            url: '#',
            isFeatured: false,
            uploadDate: new Date(2024, 2, 20)
        }
    ];

    ngOnInit(): void {
        // Cargar recursos desde el backend
    }

    search(): void {
        console.log('Searching:', this.searchQuery);
    }

    downloadResource(resource: Resource): void {
        console.log('Downloading:', resource.title);
    }

    accessResource(resource: Resource): void {
        console.log('Accessing:', resource.title);
    }

    viewAllResources(): void {
        console.log('View all resources');
    }

    getResourceIcon(type: string): string {
        const icons: Record<string, string> = {
            'pdf': 'document',
            'video': 'play',
            'code': 'code',
            'link': 'link',
            'book': 'book'
        };
        return icons[type] || 'document';
    }

    getResourceColor(type: string): string {
        const colors: Record<string, string> = {
            'pdf': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            'video': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            'code': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            'link': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            'book': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
        };
        return colors[type] || 'bg-gray-100 text-gray-600';
    }
}
