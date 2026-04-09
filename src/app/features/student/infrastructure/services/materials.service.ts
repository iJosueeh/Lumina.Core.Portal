import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap, catchError } from 'rxjs';
import { CourseMaterial, MaterialType } from '../../domain/models/course-detail.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '@core/services/cache.service';

interface CursoDetailApiResponse {
  id: string;
  modulos?: ModuloApiResponse[];
  Modulos?: ModuloApiResponse[];
}

interface ModuloApiResponse {
  id?: string;
  Id?: string;
  titulo?: string;
  Titulo?: string;
  materiales?: MaterialApiResponse[];
  Materiales?: MaterialApiResponse[];
}

interface MaterialApiResponse {
  id?: string;
  Id?: string;
  titulo?: string;
  Titulo?: string;
  nombreOriginal?: string;
  NombreOriginal?: string;
  tipo?: string;
  Tipo?: string;
  tipoArchivo?: string;
  TipoArchivo?: string;
  url?: string;
  Url?: string;
  fechaCreacion?: string;
  FechaCreacion?: string;
  tamañoBytes?: number;
  tamanoBytes?: number;
  TamañoBytes?: number;
  TamanoBytes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialsService {
  private readonly cursosApiUrl = environment.cursosApiUrl;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {}

  getMaterialsByCourse(courseId: string): Observable<CourseMaterial[]> {
    const cacheKey = `course-materials-${courseId}`;
    
    // Verificar si existe en caché
    const cachedData = this.cacheService.get<CourseMaterial[]>(cacheKey);
    if (cachedData) {
      console.log('✅ Materiales obtenidos del caché:', cacheKey);
      return of(cachedData);
    }

    console.log('📡 Realizando petición HTTP para materiales:', cacheKey);
    return this.http.get<CursoDetailApiResponse>(`${this.cursosApiUrl}/cursos/${courseId}`)
      .pipe(
        map(response => this.mapCourseMaterials(response)),
        tap(materials => {
          this.cacheService.set(cacheKey, materials, this.CACHE_TTL);
          console.log('💾 Materiales almacenados en caché:', cacheKey, materials.length, 'items');
        }),
        catchError(error => {
          console.error('❌ Error al cargar materiales del backend:', error);
          return of([]);
        })
      );
  }

  private mapCourseMaterials(response: CursoDetailApiResponse): CourseMaterial[] {
    const modulos = response.modulos ?? response.Modulos ?? [];
    const materials: CourseMaterial[] = [];

    for (const modulo of modulos) {
      const moduleId = String(modulo.id ?? modulo.Id ?? '').trim();
      const moduleName = String(modulo.titulo ?? modulo.Titulo ?? 'Módulo').trim();
      const moduloMaterials = modulo.materiales ?? modulo.Materiales ?? [];

      for (const item of moduloMaterials) {
        materials.push(this.mapToCourseMaterial(item, moduleId, moduleName));
      }
    }

    return materials;
  }

  private mapToCourseMaterial(material: MaterialApiResponse, moduleId: string, moduleName: string): CourseMaterial {
    const title =
      material.titulo ??
      material.Titulo ??
      material.nombreOriginal ??
      material.NombreOriginal ??
      'Material';

    const rawType =
      material.tipoArchivo ??
      material.TipoArchivo ??
      material.tipo ??
      material.Tipo ??
      'document';

    const sizeBytes =
      material.tamañoBytes ??
      material.tamanoBytes ??
      material.TamañoBytes ??
      material.TamanoBytes ??
      0;

    return {
      id: String(material.id ?? material.Id ?? `${moduleId}-${title}`).trim(),
      title: String(title),
      type: this.mapTipoToMaterialType(String(rawType)),
      moduleId,
      moduleName,
      lessonId: undefined,
      lessonName: undefined,
      description: undefined,
      url: String(material.url ?? material.Url ?? '').trim(),
      fileSize: sizeBytes > 0 ? this.formatFileSize(sizeBytes) : undefined,
      duration: undefined,
      isViewed: false,
      uploadDate: new Date(material.fechaCreacion ?? material.FechaCreacion ?? Date.now()),
      downloadCount: undefined
    };
  }

  private mapTipoToMaterialType(tipo: string): MaterialType {
    const tipoLower = (tipo ?? '').toLowerCase();
    if (tipoLower.includes('pdf')) return 'pdf';
    if (tipoLower.includes('video') || tipoLower.includes('mp4')) return 'video';
    if (tipoLower.includes('link') || tipoLower.includes('url')) return 'link';
    if (tipoLower.includes('codigo') || tipoLower.includes('code')) return 'code';
    return 'document';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
