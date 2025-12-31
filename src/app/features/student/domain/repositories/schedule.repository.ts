import { Observable } from 'rxjs';
import { CalendarEvent, UpcomingEvent } from '../models/calendar-event.model';

export abstract class ScheduleRepository {
    abstract getScheduleByStudent(studentId: string): Observable<CalendarEvent[]>;
    abstract getUpcomingEvents(studentId: string): Observable<UpcomingEvent[]>;
}
