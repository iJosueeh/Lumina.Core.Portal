import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ResourcesRepository } from '../../domain/repositories/resources.repository';
import { Resource } from '../../domain/models/resource.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ResourcesHttpRepositoryImpl implements ResourcesRepository {
    private readonly noticiasEventosApiUrl = environment.noticiasEventosApiUrl;

    constructor(private http: HttpClient) { }

    getResources(category?: string, type?: string, search?: string): Observable<Resource[]> {
        let params = '?page=1&pageSize=50'; // Traer todos por ahora
        if (category && category !== 'Todos') params += `&categoria=${category}`;
        if (type) params += `&tipo=${type}`;
        if (search) params += `&search=${search}`;

        return this.http.get<any[]>(`${this.noticiasEventosApiUrl}/recursos${params}`)
            .pipe(
                map(recursos => recursos.map(this.mapToResource))
            );
    }

    getFeaturedResources(): Observable<Resource[]> {
        return this.http.get<any[]>(`${this.noticiasEventosApiUrl}/recursos?destacado=true&pageSize=5`)
            .pipe(
                map(recursos => recursos.map(this.mapToResource))
            );
    }

    private mapToResource(dto: any): Resource {
        return {
            id: dto.id,
            title: dto.titulo,
            description: dto.descripcion,
            category: dto.categoria,
            type: dto.tipo.toLowerCase() as any, // 'pdf' | 'video' | 'link', etc.
            url: dto.url,
            imageUrl: dto.imagen || dto.imagenUrl || 'https://via.placeholder.com/400x250?text=Recurso',
            badge: dto.categoria.toUpperCase(),
            isFeatured: dto.esDestacado,
            uploadDate: new Date(dto.fechaPublicacion),
            fileSize: dto.tipo === 'PDF' ? '2.5 MB' : undefined // Mocked file size for now
        };
    }
}
