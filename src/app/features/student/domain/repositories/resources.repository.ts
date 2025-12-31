import { Observable } from 'rxjs';
import { Resource } from '../models/resource.model';

export abstract class ResourcesRepository {
    abstract getResources(category?: string, type?: string, search?: string): Observable<Resource[]>;
    abstract getFeaturedResources(): Observable<Resource[]>;
}
