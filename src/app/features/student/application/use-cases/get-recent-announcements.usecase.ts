import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnnouncementsRepository } from '@features/student/domain/repositories/announcements.repository';
import { Announcement } from '@features/student/domain/models/announcement.model';

@Injectable({
    providedIn: 'root'
})
export class GetRecentAnnouncementsUseCase {
    constructor(private announcementsRepository: AnnouncementsRepository) { }

    execute(studentId: string): Observable<Announcement[]> {
        return this.announcementsRepository.getRecentAnnouncements(studentId);
    }
}
