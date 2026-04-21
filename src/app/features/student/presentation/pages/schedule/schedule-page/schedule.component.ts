import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, UpcomingEvent, MonthDay } from '@features/student/domain/models/calendar-event.model';
import { AddEventModalComponent } from '../add-event-modal/add-event-modal.component';
import { EventDetailModalComponent } from '../event-detail-modal/event-detail-modal.component';
import { AllTasksModalComponent } from '../all-tasks-modal/all-tasks-modal.component';
import { map, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { CoursesService } from '@features/student/infrastructure/services/courses.service';
import { CursoConHorarios } from '@features/student/domain/models/horario.model';
import { DateUtils } from '../../../../../../shared/utils/date.utils';
import { ScheduleMapper } from '../../../../../../shared/mappers/schedule.mapper';

type ViewMode = 'day' | 'week' | 'month';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEventModalComponent, EventDetailModalComponent, AllTasksModalComponent],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css',
})
export class ScheduleComponent implements OnInit {
  private coursesService = inject(CoursesService);
  private mapper = inject(ScheduleMapper);

  viewMode: ViewMode = 'week';
  selectedDate = signal(new Date());
  events = signal<CalendarEvent[]>([]);
  upcomingEvents = signal<UpcomingEvent[]>([]);
  searchQuery = signal('');
  
  isLoading = signal(false);
  showAddEventModal = signal(false);
  showEventDetailModal = signal(false);
  showAllTasksModal = signal(false);
  selectedEvent: CalendarEvent | null = null;

  weekDays: any[] = [];
  timeSlots: string[] = [];
  monthDays: MonthDay[] = [];

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.events().filter(e => 
      !query || e.title.toLowerCase().includes(query) || (e.location && e.location.toLowerCase().includes(query))
    );
  });

  errorMessage = signal('');

  get currentWeek() {
    const current = this.selectedDate();
    if (this.viewMode === 'day') return current.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (this.viewMode === 'month') return this.currentMonth;
    const start = new Date(current);
    start.setDate(current.getDate() - (current.getDay() === 0 ? 6 : current.getDay() - 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 5);
    return `Semana del ${start.getDate()} al ${end.getDate()} de ${this.currentMonth}`;
  }

  previousWeek() { this.changeDate(-1); }
  nextWeek() { this.changeDate(1); }

  onEventAdded(event: CalendarEvent) {
    this.events.update(evs => [...evs, event]);
  }

  openEventDetail(event: CalendarEvent) { this.selectedEvent = event; this.showEventDetailModal.set(true); }

  closeEventDetailModal() { this.showEventDetailModal.set(false); this.selectedEvent = null; }

  closeAddEventModal() { this.showAddEventModal.set(false); }

  openAllTasksModal() { this.showAllTasksModal.set(true); }

  closeAllTasksModal() { this.showAllTasksModal.set(false); }

  getDayEvents() {
    const current = this.selectedDate();
    return this.filteredEvents().filter(e => DateUtils.isSameDate(e.date, current));
  }

  selectDayFromMonth(day: MonthDay) {
    this.selectedDate.set(day.date);
    this.viewMode = 'day';
    this.updateView();
  }

  get currentMonth() { return DateUtils.formatMonthYear(this.selectedDate()); }

  ngOnInit() {
    this.generateTimeSlots();
    this.updateView();
    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);
    this.coursesService.getAllCourses().pipe(
      switchMap(cursos => cursos.length ? forkJoin(cursos.map(c => this.coursesService.getCourseById(c.id))) : of([])),
      map(data => data.filter(c => !!c) as CursoConHorarios[])
    ).subscribe(cursos => {
      const evs = this.mapper.transformSchedulesToEvents(cursos);
      this.events.set(evs);
      this.upcomingEvents.set(this.mapper.generateUpcomingEvents(evs));
      this.isLoading.set(false);
    });
  }

  updateView() {
    const current = this.selectedDate();
    if (this.viewMode === 'month') this.generateMonthView();
    else if (this.viewMode === 'week') this.generateWeekDays(current);
    else this.weekDays = [{ name: 'HOY', date: current.getDate().toString(), isToday: true }];
  }

  private generateWeekDays(current: Date) {
    const start = new Date(current);
    start.setDate(current.getDate() - (current.getDay() === 0 ? 6 : current.getDay() - 1));
    this.weekDays = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { name: ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][i], date: d.getDate().toString(), isToday: DateUtils.isSameDate(d, new Date()) };
    });
  }

  private generateMonthView() {
    const d = this.selectedDate();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
    this.monthDays = Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayEvs = this.filteredEvents().filter(e => DateUtils.isSameDate(e.date, date));
      return { date, number: date.getDate(), isToday: DateUtils.isSameDate(date, new Date()), isCurrentMonth: date.getMonth() === d.getMonth(), events: dayEvs, eventCount: dayEvs.length };
    });
  }

  getEventsForDay(idx: number) { return this.filteredEvents().filter(e => e.dayOfWeek === idx); }

  getEventPosition(event: CalendarEvent) {
    const [sh, sm] = event.startTime.split(':').map(Number);
    const [eh, em] = event.endTime.split(':').map(Number);
    return { top: `${((sh - 7) * 60 + sm) * 1.06}px`, height: `${((eh - sh) * 60 + (em - sm)) * 1.06}px` };
  }

  changeDate(offset: number) {
    const d = new Date(this.selectedDate());
    if (this.viewMode === 'day') d.setDate(d.getDate() + offset);
    else if (this.viewMode === 'month') d.setMonth(d.getMonth() + offset);
    else d.setDate(d.getDate() + offset * 7);
    this.selectedDate.set(d);
    this.updateView();
  }

  setViewMode(m: ViewMode) { this.viewMode = m; this.updateView(); }
  
  onSearch(q: string) { this.searchQuery.set(q); }

  private generateTimeSlots() {
    this.timeSlots = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
  }
}
