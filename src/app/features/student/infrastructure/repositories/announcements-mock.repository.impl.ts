import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AnnouncementsRepository } from '@features/student/domain/repositories/announcements.repository';
import { Announcement } from '@features/student/domain/models/announcement.model';

@Injectable({
    providedIn: 'root'
})
export class AnnouncementsMockRepositoryImpl extends AnnouncementsRepository {

    private mockAnnouncements: Announcement[] = [
        {
            id: '1',
            titulo: 'Mantenimiento de plataforma',
            descripcion: 'La plataforma estará en mantenimiento este sábado de 2:00 AM a 4:00 AM',
            fechaPublicacion: new Date(Date.now() - 2 * 60 * 60 * 1000),
            autor: 'Admin',
            tipo: 'SISTEMA',
            icono: 'tools',
            tiempoRelativo: 'Hace 2 horas'
        },
        {
            id: '2',
            titulo: 'Nuevo recurso disponible',
            descripcion: 'El Prof. García ha subido los diapositivas de la semana 5 en "Desarrollo Web".',
            fechaPublicacion: new Date(Date.now() - 24 * 60 * 60 * 1000),
            autor: 'Prof. García',
            tipo: 'CURSO',
            icono: 'document',
            tiempoRelativo: 'Ayer'
        }
    ];

    override getRecentAnnouncements(studentId: string): Observable<Announcement[]> {
        return of(this.mockAnnouncements).pipe(delay(300));
    }
}
