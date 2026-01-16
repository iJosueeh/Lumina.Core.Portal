import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AnnouncementsRepository } from '@features/student/domain/repositories/announcements.repository';
import { Announcement } from '@features/student/domain/models/announcement.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AnnouncementsMockRepositoryImpl extends AnnouncementsRepository {
  constructor(private http: HttpClient) {
    super();
  }

  override getRecentAnnouncements(studentId: string): Observable<Announcement[]> {
    return this.http.get<Announcement[]>('/assets/mock-data/announcements/announcements.json').pipe(
      map((announcements) =>
        announcements.map((a) => ({
          ...a,
          fechaPublicacion: new Date(a.fechaPublicacion),
        })),
      ),
      delay(300),
    );
  }
}
