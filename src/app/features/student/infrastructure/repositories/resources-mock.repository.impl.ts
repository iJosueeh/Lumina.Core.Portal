import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ResourcesRepository } from '../../domain/repositories/resources.repository';
import { Resource } from '../../domain/models/resource.model';
import {
  getMockResources,
  getMockFeaturedResources,
  getMockResourcesByCategory,
} from '../../../../core/mock-data/announcements-resources.mock';

/**
 * Implementación Mock del repositorio de recursos
 * Usa datos estáticos para desarrollo sin backend
 */
@Injectable({
  providedIn: 'root',
})
export class ResourcesMockRepositoryImpl extends ResourcesRepository {
  override getResources(category?: string, type?: string, search?: string): Observable<Resource[]> {
    let resources = getMockResources();

    // Filtrar por categoría si se proporciona
    if (category && category !== 'Todos') {
      resources = getMockResourcesByCategory(category);
    }

    // Filtrar por tipo si se proporciona
    if (type) {
      resources = resources.filter((r) => r.type === type);
    }

    // Filtrar por búsqueda si se proporciona
    if (search) {
      const searchLower = search.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower),
      );
    }

    return of(resources).pipe(delay(300));
  }

  override getFeaturedResources(): Observable<Resource[]> {
    return of(getMockFeaturedResources()).pipe(delay(300));
  }
}
