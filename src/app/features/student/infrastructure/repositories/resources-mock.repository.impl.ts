import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ResourcesRepository } from '../../domain/repositories/resources.repository';
import { Resource } from '../../domain/models/resource.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ResourcesMockRepositoryImpl extends ResourcesRepository {
  constructor(private http: HttpClient) {
    super();
  }

  override getResources(category?: string, type?: string, search?: string): Observable<Resource[]> {
    return this.http.get<Resource[]>('assets/mock-data/resources/resources.json').pipe(
      map((resources) => {
        let filtered = resources.map((r) => ({
          ...r,
          uploadDate: new Date(r.uploadDate),
        }));

        // Filtrar por categoría si se proporciona
        if (category && category !== 'Todos') {
          filtered = filtered.filter((r) => r.category === category);
        }

        // Filtrar por tipo si se proporciona
        if (type) {
          filtered = filtered.filter((r) => r.type === type);
        }

        // Filtrar por búsqueda si se proporciona
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.title.toLowerCase().includes(searchLower) ||
              r.description.toLowerCase().includes(searchLower),
          );
        }

        return filtered;
      }),
      delay(300),
    );
  }

  override getFeaturedResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>('assets/mock-data/resources/resources.json').pipe(
      map((resources) =>
        resources
          .filter((r) => r.isFeatured)
          .map((r) => ({
            ...r,
            uploadDate: new Date(r.uploadDate),
          })),
      ),
      delay(300),
    );
  }
}
