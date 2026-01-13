import { Announcement } from '../../features/student/domain/models/announcement.model';
import { Resource, ResourceCategory } from '../../features/student/domain/models/resource.model';

/**
 * Mock Data - Anuncios y Recursos
 * Datos estáticos para el portal estudiantil
 */

// ============================================
// ANUNCIOS
// ============================================

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    titulo: 'Nuevo material disponible: Desarrollo Web Full Stack',
    descripcion:
      'Se ha publicado el material del Módulo 4 sobre Backend y APIs. Incluye videos, lecturas y proyecto final.',
    fechaPublicacion: new Date('2024-01-10T10:00:00'),
    autor: 'Prof. Carlos Mendoza',
    tipo: 'CURSO',
    icono: 'book-open',
    tiempoRelativo: 'Hace 2 días',
  },
  {
    id: 'ann-2',
    titulo: 'Recordatorio: Examen Final de Base de Datos',
    descripcion:
      'El examen final del curso de Base de Datos Relacionales será el 15 de enero. Duración: 90 minutos.',
    fechaPublicacion: new Date('2024-01-09T14:30:00'),
    autor: 'Prof. Ana Martínez',
    tipo: 'CURSO',
    icono: 'alert-circle',
    tiempoRelativo: 'Hace 3 días',
  },
  {
    id: 'ann-3',
    titulo: 'Mantenimiento programado del sistema',
    descripcion:
      'El portal estará en mantenimiento el sábado 13 de enero de 2:00 AM a 6:00 AM. Durante este tiempo no estará disponible.',
    fechaPublicacion: new Date('2024-01-08T16:00:00'),
    autor: 'Administración Lumina',
    tipo: 'SISTEMA',
    icono: 'settings',
    tiempoRelativo: 'Hace 4 días',
  },
  {
    id: 'ann-4',
    titulo: 'Inscripciones abiertas para talleres de verano',
    descripcion:
      'Ya están abiertas las inscripciones para los talleres de verano 2024: Machine Learning, Cloud Computing y DevOps.',
    fechaPublicacion: new Date('2024-01-07T09:00:00'),
    autor: 'Coordinación Académica',
    tipo: 'GENERAL',
    icono: 'calendar',
    tiempoRelativo: 'Hace 5 días',
  },
  {
    id: 'ann-5',
    titulo: 'Actualización de notas: Arquitectura de Software',
    descripcion:
      'Se han publicado las calificaciones del Proyecto de Microservicios. Revisa tu progreso en la sección de Notas.',
    fechaPublicacion: new Date('2024-01-06T11:30:00'),
    autor: 'Prof. Laura Vega',
    tipo: 'CURSO',
    icono: 'file-text',
    tiempoRelativo: 'Hace 6 días',
  },
];

// ============================================
// RECURSOS
// ============================================

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: 'Guía Completa de JavaScript ES6+',
    description:
      'Documento PDF con todos los conceptos modernos de JavaScript, desde lo básico hasta avanzado.',
    category: 'Programación',
    type: 'pdf',
    url: '#',
    imageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400',
    badge: 'Nuevo',
    isFeatured: true,
    uploadDate: new Date('2024-01-10'),
    fileSize: '2.5 MB',
  },
  {
    id: 'res-2',
    title: 'Tutorial: React Hooks en Profundidad',
    description:
      'Serie de videos explicando useState, useEffect, useContext y custom hooks con ejemplos prácticos.',
    category: 'Frontend',
    type: 'video',
    url: '#',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    badge: 'Popular',
    isFeatured: true,
    uploadDate: new Date('2024-01-08'),
    fileSize: '450 MB',
  },
  {
    id: 'res-3',
    title: 'Repositorio: Proyectos de Ejemplo',
    description:
      'Colección de proyectos completos en GitHub para practicar y aprender buenas prácticas.',
    category: 'Código',
    type: 'code',
    url: 'https://github.com/lumina-examples',
    imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400',
    isFeatured: false,
    uploadDate: new Date('2024-01-05'),
  },
  {
    id: 'res-4',
    title: 'SQL Cheat Sheet',
    description: 'Hoja de referencia rápida con los comandos SQL más utilizados y ejemplos.',
    category: 'Bases de Datos',
    type: 'pdf',
    url: '#',
    imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400',
    isFeatured: false,
    uploadDate: new Date('2024-01-03'),
    fileSize: '1.2 MB',
  },
  {
    id: 'res-5',
    title: 'Documentación Oficial de Node.js',
    description: 'Enlace directo a la documentación oficial de Node.js con guías y API reference.',
    category: 'Backend',
    type: 'link',
    url: 'https://nodejs.org/docs',
    isFeatured: false,
    uploadDate: new Date('2024-01-01'),
  },
  {
    id: 'res-6',
    title: 'Clean Code: Principios y Prácticas',
    description: 'Libro digital sobre cómo escribir código limpio, mantenible y profesional.',
    category: 'Arquitectura',
    type: 'book',
    url: '#',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    badge: 'Recomendado',
    isFeatured: true,
    uploadDate: new Date('2023-12-28'),
    fileSize: '5.8 MB',
  },
];

// ============================================
// CATEGORÍAS DE RECURSOS
// ============================================

export const MOCK_RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: 'cat-1',
    name: 'Programación',
    icon: 'code',
    description: 'Recursos sobre lenguajes de programación y lógica',
    count: 12,
  },
  {
    id: 'cat-2',
    name: 'Frontend',
    icon: 'layout',
    description: 'Frameworks y herramientas de desarrollo frontend',
    count: 8,
  },
  {
    id: 'cat-3',
    name: 'Backend',
    icon: 'server',
    description: 'Desarrollo de APIs y servicios backend',
    count: 10,
  },
  {
    id: 'cat-4',
    name: 'Bases de Datos',
    icon: 'database',
    description: 'SQL, NoSQL y diseño de bases de datos',
    count: 6,
  },
  {
    id: 'cat-5',
    name: 'Arquitectura',
    icon: 'layers',
    description: 'Patrones de diseño y arquitectura de software',
    count: 7,
  },
  {
    id: 'cat-6',
    name: 'DevOps',
    icon: 'git-branch',
    description: 'CI/CD, Docker, Kubernetes y automatización',
    count: 5,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene todos los anuncios
 */
export function getMockAnnouncements(): Announcement[] {
  return MOCK_ANNOUNCEMENTS.map((ann) => ({ ...ann }));
}

/**
 * Obtiene anuncios por tipo
 */
export function getMockAnnouncementsByType(tipo: 'SISTEMA' | 'CURSO' | 'GENERAL'): Announcement[] {
  return MOCK_ANNOUNCEMENTS.filter((ann) => ann.tipo === tipo);
}

/**
 * Obtiene todos los recursos
 */
export function getMockResources(): Resource[] {
  return MOCK_RESOURCES.map((res) => ({ ...res }));
}

/**
 * Obtiene recursos destacados
 */
export function getMockFeaturedResources(): Resource[] {
  return MOCK_RESOURCES.filter((res) => res.isFeatured);
}

/**
 * Obtiene recursos por categoría
 */
export function getMockResourcesByCategory(category: string): Resource[] {
  return MOCK_RESOURCES.filter((res) => res.category === category);
}

/**
 * Obtiene todas las categorías de recursos
 */
export function getMockResourceCategories(): ResourceCategory[] {
  return MOCK_RESOURCE_CATEGORIES.map((cat) => ({ ...cat }));
}
