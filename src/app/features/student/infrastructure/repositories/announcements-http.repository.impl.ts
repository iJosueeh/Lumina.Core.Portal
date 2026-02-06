import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { AnnouncementsRepository } from '../../domain/repositories/announcements.repository';
import { Announcement } from '../../domain/models/announcement.model';
import { environment } from '../../../../../environments/environment';
import { CacheService } from '@core/services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class AnnouncementsHttpRepositoryImpl implements AnnouncementsRepository {
    private readonly noticiasEventosApiUrl = environment.noticiasEventosApiUrl;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos (noticias cambian menos)

    constructor(
        private http: HttpClient,
        private cacheService: CacheService
    ) { }

    getRecentAnnouncements(studentId: string): Observable<Announcement[]> {
        const cacheKey = `student-announcements-${studentId}`;
        
        // Verificar caché
        const cachedData = this.cacheService.get<Announcement[]>(cacheKey);
        if (cachedData) {
            console.log(`📦 Announcements obtenidos del caché para estudiante ${studentId}`);
            return of(cachedData);
        }

        console.log(`🌐 Obteniendo announcements desde API para estudiante ${studentId}`);
        // Por ahora, las noticias no están filtradas por estudiante
        // Obtenemos las 5 más recientes del sistema
        const limit = 5;
        return this.http.get<any[]>(`${this.noticiasEventosApiUrl}/noticias?page=1&pageSize=${limit}`)
            .pipe(
                map(announcements => announcements.map(announcement => {
                    const publishDate = new Date(announcement.fecha);
                    const now = new Date();
                    const diffMs = now.getTime() - publishDate.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    let tiempoRelativo = '';
                    if (diffDays === 0) {
                        tiempoRelativo = 'Hoy';
                    } else if (diffDays === 1) {
                        tiempoRelativo = 'Ayer';
                    } else if (diffDays < 7) {
                        tiempoRelativo = `Hace ${diffDays} días`;
                    } else {
                        tiempoRelativo = publishDate.toLocaleDateString('es-ES');
                    }

                    return {
                        id: announcement.id,
                        titulo: announcement.titulo,
                        descripcion: announcement.descripcion,
                        fechaPublicacion: publishDate,
                        autor: announcement.autor || 'Administración',
                        tipo: this.mapTipo(announcement.categoria),
                        icono: this.getIconForTipo(this.mapTipo(announcement.categoria)),
                        tiempoRelativo
                    };
                })),
                tap(announcements => {
                    // Guardar en caché
                    this.cacheService.set(cacheKey, announcements, this.CACHE_TTL);
                    console.log(`💾 Announcements guardados en caché (TTL: ${this.CACHE_TTL / 1000}s)`);
                })
            );
    }

    private mapTipo(categoria: string): 'SISTEMA' | 'CURSO' | 'GENERAL' {
        if (categoria?.toLowerCase().includes('sistema')) return 'SISTEMA';
        if (categoria?.toLowerCase().includes('curso') || categoria?.toLowerCase().includes('académico')) return 'CURSO';
        return 'GENERAL';
    }

    private getIconForTipo(tipo: 'SISTEMA' | 'CURSO' | 'GENERAL'): string {
        const icons = {
            'SISTEMA': 'settings',
            'CURSO': 'school',
            'GENERAL': 'campaign'
        };
        return icons[tipo];
    }
}
