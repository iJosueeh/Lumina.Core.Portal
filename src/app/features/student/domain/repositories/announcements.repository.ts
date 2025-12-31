import { Observable } from 'rxjs';
import { Announcement } from '../models/announcement.model';

export abstract class AnnouncementsRepository {
    abstract getRecentAnnouncements(studentId: string): Observable<Announcement[]>;
}
