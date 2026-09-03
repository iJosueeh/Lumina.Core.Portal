import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

const MOCK_NOTICIAS = [
  {
    id: '1',
    titulo: 'Lanzamiento del nuevo Bootcamp de Inteligencia Artificial',
    descripcion: 'Lanzamiento del nuevo Bootcamp de Inteligencia Artificial',
    imagenUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    fecha: '2026-05-26T00:00:00Z',
    categoria: 'Académico',
    badge: { texto: 'ACADÉMICO', color: '#3b82f6' },
    autor: 'Carlos Mendoza',
    autorAvatar: null,
    tiempoLectura: '3 min',
    contenido: 'La universidad abre inscripciones para el programa intensivo diseñado para formar a la próxima generación de expertos en IA y machine learning.',
    tags: ['IA', 'Bootcamp', 'Tecnología']
  },
  {
    id: '2',
    titulo: 'Estudiantes ganan Hackathon Regional de Ciberseguridad',
    descripcion: 'Estudiantes ganan Hackathon Regional de Ciberseguridad',
    imagenUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    fecha: '2026-05-24T00:00:00Z',
    categoria: 'Tecnología',
    badge: { texto: 'TECNOLOGÍA', color: '#8b5cf6' },
    autor: 'María Rodríguez',
    autorAvatar: null,
    tiempoLectura: '4 min',
    contenido: 'Nuestro equipo obtuvo el primer lugar en la competencia anual de seguridad informática celebrada en la capital.',
    tags: ['Ciberseguridad', 'Hackathon', 'Logro']
  },
  {
    id: '3',
    titulo: 'Resumen de la Conferencia de Tecnología 2026',
    descripcion: 'Resumen de la Conferencia de Tecnología 2026',
    imagenUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    fecha: '2026-05-20T00:00:00Z',
    categoria: 'Eventos',
    badge: { texto: 'EVENTOS', color: '#f59e0b' },
    autor: 'Ricardo Guevara',
    autorAvatar: null,
    tiempoLectura: '5 min',
    contenido: 'Expertos de la industria compartieron sus conocimientos sobre las últimas tendencias en desarrollo web y móvil.',
    tags: ['Conferencia', 'Tecnología', 'Web']
  },
  {
    id: '4',
    titulo: 'Nuevos espacios de coworking para alumnos',
    descripcion: 'Nuevos espacios de coworking para alumnos',
    imagenUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    fecha: '2026-05-13T00:00:00Z',
    categoria: 'Vida Estudiantil',
    badge: { texto: 'COMUNIDAD', color: '#10b981' },
    autor: 'Admin',
    autorAvatar: null,
    tiempoLectura: '2 min',
    contenido: 'Inauguramos modernas áreas de estudio colaborativo equipadas con internet de alta velocidad y monitores para trabajo grupal.',
    tags: ['Coworking', 'Estudiantes', 'Infraestructura']
  }
];

const MOCK_EVENTOS = [
  {
    id: '1',
    titulo: 'Webinar: El futuro de React',
    descripcion: 'Únete a este webinar donde exploraremos las nuevas características de React 19 y cómo pueden transformar tus proyectos.',
    fecha: '2026-09-15T18:00:00Z',
    ubicacion: 'Online',
    tipo: 'Webinar',
    imagenUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'
  },
  {
    id: '2',
    titulo: 'Workshop: UX/UI Design Essentials',
    descripcion: 'Aprende los fundamentos del diseño UX/UI en este workshop práctico de 4 horas.',
    fecha: '2026-09-20T09:00:00Z',
    ubicacion: 'Auditorio Principal',
    tipo: 'Workshop',
    imagenUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800'
  },
  {
    id: '3',
    titulo: 'Feria de Empleabilidad Tech 2026',
    descripcion: 'Conecta con las mejores empresas tecnológicas buscando talento. Oportunidades de empleo para todos los perfiles.',
    fecha: '2026-10-05T10:00:00Z',
    ubicacion: 'Centro de Convenciones',
    tipo: 'Feria',
    imagenUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  }
];

export const mockFallbackInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo aplicar a peticiones de noticias/eventos
  const isNoticiasRequest = req.url.includes('/noticias');
  const isEventosRequest = req.url.includes('/eventos');

  if (!isNoticiasRequest && !isEventosRequest) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error) => {
      // Si hay error de red o 404, devolver mock data con delay simulado
      if (error.status === 0 || error.status === 404 || error.status >= 500) {
        console.warn(`⚠️ [MOCK FALLBACK] API no disponible para ${req.url}, usando datos mock`);

        if (isNoticiasRequest) {
          if (req.method === 'GET' && req.url.match(/\/noticias\/[^/]+$/)) {
            // GET /noticias/:id -> devolver primera mock
            return of(new HttpResponse({ status: 200, body: MOCK_NOTICIAS[0] })).pipe(delay(200));
          }
          if (req.method === 'GET') {
            // GET /noticias -> devolver lista
            return of(new HttpResponse({ status: 200, body: MOCK_NOTICIAS })).pipe(delay(200));
          }
          if (req.method === 'POST') {
            // POST /noticias -> retornar id mock
            return of(new HttpResponse({ status: 201, body: { id: `mock-${Date.now()}` } })).pipe(delay(300));
          }
          if (req.method === 'PUT' || req.method === 'DELETE') {
            return of(new HttpResponse({ status: 200 })).pipe(delay(200));
          }
        }

        if (isEventosRequest) {
          if (req.method === 'GET' && req.url.match(/\/eventos\/[^/]+$/)) {
            return of(new HttpResponse({ status: 200, body: MOCK_EVENTOS[0] })).pipe(delay(200));
          }
          if (req.method === 'GET') {
            return of(new HttpResponse({ status: 200, body: MOCK_EVENTOS })).pipe(delay(200));
          }
          if (req.method === 'POST') {
            return of(new HttpResponse({ status: 201, body: { id: `mock-${Date.now()}` } })).pipe(delay(300));
          }
          if (req.method === 'PUT' || req.method === 'DELETE') {
            return of(new HttpResponse({ status: 200 })).pipe(delay(200));
          }
        }
      }

      // Si no es error recuperable, propagar el error
      console.error(`❌ [MOCK FALLBACK] Error no recuperable:`, error);
      return next(req);
    })
  );
};
