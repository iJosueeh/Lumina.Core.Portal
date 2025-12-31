import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AnnouncementsRepository } from '../../domain/repositories/announcements.repository';
import { Announcement } from '../../domain/models/announcement.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AnnouncementsHttpRepositoryImpl implements AnnouncementsRepository {
    private readonly noticiasEventosApiUrl = environment.noticiasEventosApiUrl;

    constructor(private http: HttpClient) { }

    getRecentAnnouncements(studentId: string): Observable<Announcement[]> {
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
                }))
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
