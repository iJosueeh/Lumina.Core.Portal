import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ScheduleRepository } from '@features/student/domain/repositories/schedule.repository';
import { UpcomingEvent } from '@features/student/domain/models/calendar-event.model';

@Injectable({
    providedIn: 'root'
})
export class GetUpcomingEventsUseCase {
    constructor(private scheduleRepository: ScheduleRepository) { }

    execute(studentId: string): Observable<UpcomingEvent[]> {
        return this.scheduleRepository.getUpcomingEvents(studentId);
    }
}
