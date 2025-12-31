import { Observable } from 'rxjs';
import { Announcement, AnnouncementInput } from '../models/announcement.model';

export abstract class AnnouncementRepository {
    abstract getAnnouncementsByTeacher(teacherId: string): Observable<Announcement[]>;
    abstract getAnnouncementsByCourse(courseId: string): Observable<Announcement[]>;
    abstract createAnnouncement(announcement: AnnouncementInput): Observable<Announcement>;
    abstract updateAnnouncement(announcementId: string, announcement: Partial<AnnouncementInput>): Observable<Announcement>;
    abstract deleteAnnouncement(announcementId: string): Observable<void>;
}
