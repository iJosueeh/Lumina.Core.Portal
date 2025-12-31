import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ScheduleRepository } from '@features/student/domain/repositories/schedule.repository';
import { CalendarEvent } from '@features/student/domain/models/calendar-event.model';

@Injectable({
    providedIn: 'root'
})
export class GetStudentScheduleUseCase {
    constructor(private scheduleRepository: ScheduleRepository) { }

    execute(studentId: string): Observable<CalendarEvent[]> {
        return this.scheduleRepository.getScheduleByStudent(studentId);
    }
}
