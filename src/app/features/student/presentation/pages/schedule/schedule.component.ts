import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CalendarEvent,
  UpcomingEvent,
  MonthDay,
} from '@features/student/domain/models/calendar-event.model';
import { AddEventModalComponent } from './add-event-modal.component';
import { EventDetailModalComponent } from './event-detail-modal.component';
import { AllTasksModalComponent } from './all-tasks-modal.component';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

type ViewMode = 'day' | 'week' | 'month';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddEventModalComponent,
    EventDetailModalComponent,
    AllTasksModalComponent,
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css',
})
export class ScheduleComponent implements OnInit {
  // Config
  viewMode: ViewMode = 'week';
  selectedDate = signal(new Date());

  // Data
  events: CalendarEvent[] = [];
  upcomingEvents: UpcomingEvent[] = [];
  isLoading = false;
  errorMessage = '';
  showAddEventModal = signal(false);
  showEventDetailModal = signal(false);
  showAllTasksModal = signal(false);
  selectedEvent: CalendarEvent | null = null;

  // Template Helpers
  weekDays: { name: string; date: string; isToday: boolean }[] = [];
  timeSlots: string[] = [];
  currentMonth: string = '';
  currentWeek: string = '';

  // Search
  searchQuery: string = '';
  filteredEvents: CalendarEvent[] = [];

  // Month view
  monthDays: MonthDay[] = [];

  constructor(private http: HttpClient) {
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    this.updateCalendarView();
    this.loadSchedule();
  }

  private loadSchedule(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Cargar horario
    this.http
      .get<CalendarEvent[]>('/assets/mock-data/schedule/calendar-events.json')
      .pipe(
        map((events) =>
          events.map((event) => ({
            ...event,
            date: new Date(event.date),
          })),
        ),
      )
      .subscribe({
        next: (events) => {
          this.events = events;
          this.filteredEvents = events;
          this.loadUpcomingEvents();
        },
        error: (err) => {
          console.error('Error loading schedule:', err);
          this.errorMessage = 'Error al cargar el horario.';
          this.isLoading = false;
        },
      });
  }

  private loadUpcomingEvents(): void {
    this.http
      .get<UpcomingEvent[]>('/assets/mock-data/schedule/upcoming-events.json')
      .pipe(
        map((events) =>
          events.map((event) => ({
            ...event,
            date: new Date(event.date),
          })),
        ),
      )
      .subscribe({
        next: (events) => {
          this.upcomingEvents = events;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading upcoming events:', err);
          this.isLoading = false;
        },
      });
  }

  private generateTimeSlots(): void {
    this.timeSlots = Array.from({ length: 14 }, (_, i) => {
      const hour = i + 7; // 7 AM a 8 PM
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  }

  private updateCalendarView(): void {
    const current = this.selectedDate();

    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    this.currentMonth = current
      .toLocaleDateString('es-ES', options)
      .replace(/^\w/, (c) => c.toUpperCase());

    if (this.viewMode === 'day') {
      // Vista día: mostrar solo el día seleccionado
      const dayOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      this.currentWeek = current
        .toLocaleDateString('es-ES', dayOptions)
        .replace(/^\w/, (c) => c.toUpperCase());

      this.weekDays = [
        {
          name: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][current.getDay()],
          date: current.getDate().toString(),
          isToday: this.isSameDate(current, new Date()),
        },
      ];
    } else if (this.viewMode === 'month') {
      this.generateMonthView();
      this.currentWeek = this.currentMonth;
    } else {
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(current);
      monday.setDate(diff);

      this.weekDays = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return {
          name: ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][i],
          date: date.getDate().toString(),
          isToday: this.isSameDate(date, new Date()),
        };
      });

      const endOfWeek = new Date(monday);
      endOfWeek.setDate(monday.getDate() + 5);
      this.currentWeek = `Semana del ${monday.getDate()} al ${endOfWeek.getDate()} de ${this.currentMonth.split(' ')[0]}`;
    }
  }

  private isSameDate(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.updateCalendarView();
  }

  previousWeek(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);
    if (this.viewMode === 'day') {
      newDate.setDate(current.getDate() - 1);
    } else if (this.viewMode === 'month') {
      newDate.setMonth(current.getMonth() - 1);
    } else {
      newDate.setDate(current.getDate() - 7);
    }
    this.selectedDate.set(newDate);
    this.updateCalendarView();
  }

  nextWeek(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);
    if (this.viewMode === 'day') {
      newDate.setDate(current.getDate() + 1);
    } else if (this.viewMode === 'month') {
      newDate.setMonth(current.getMonth() + 1);
    } else {
      newDate.setDate(current.getDate() + 7);
    }
    this.selectedDate.set(newDate);
    this.updateCalendarView();
  }

  getEventsForDay(dayIndex: number): CalendarEvent[] {
    const eventsToFilter = this.searchQuery ? this.filteredEvents : this.events;
    return eventsToFilter.filter((event) => event.dayOfWeek === dayIndex);
  }

  getEventPosition(event: CalendarEvent): { top: string; height: string } {
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);

    const startMinutes = (startHour - 7) * 60 + startMin; // Offset desde las 7 AM
    const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);

    const topPx = (startMinutes / 60) * 64;
    const heightPx = (durationMinutes / 60) * 64;

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
  }

  createEvent(): void {
    this.showAddEventModal.set(true);
  }

  closeAddEventModal(): void {
    this.showAddEventModal.set(false);
  }

  onEventAdded(event: CalendarEvent): void {
    this.events = [...this.events, event];
  }

  // Modal handlers
  openEventDetail(event: CalendarEvent): void {
    this.selectedEvent = event;
    this.showEventDetailModal.set(true);
  }

  closeEventDetailModal(): void {
    this.showEventDetailModal.set(false);
    this.selectedEvent = null;
  }

  openAllTasksModal(): void {
    this.showAllTasksModal.set(true);
  }

  closeAllTasksModal(): void {
    this.showAllTasksModal.set(false);
  }

  // Search functionality
  onSearch(query: string): void {
    this.searchQuery = query.toLowerCase();

    if (!query) {
      this.filteredEvents = this.events;
      return;
    }

    this.filteredEvents = this.events.filter(
      (event) =>
        event.title.toLowerCase().includes(this.searchQuery) ||
        (event.professor && event.professor.toLowerCase().includes(this.searchQuery)) ||
        event.location.toLowerCase().includes(this.searchQuery),
    );
  }

  // Day view helpers
  getDayEvents(): CalendarEvent[] {
    const current = this.selectedDate();
    const eventsToFilter = this.searchQuery ? this.filteredEvents : this.events;
    return eventsToFilter.filter((event) => {
      const eventDate = new Date(event.date);
      return this.isSameDate(eventDate, current);
    });
  }

  // Month view helpers
  generateMonthView(): void {
    const current = this.selectedDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Ajustar al inicio de la semana (Lunes)
    const startDate = new Date(firstDay);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));

    // Generar 42 días (6 semanas)
    this.monthDays = [];
    const eventsToFilter = this.searchQuery ? this.filteredEvents : this.events;
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayEvents = eventsToFilter.filter((event) => {
        const eventDate = new Date(event.date);
        return this.isSameDate(eventDate, date);
      });

      this.monthDays.push({
        date,
        number: date.getDate(),
        isToday: this.isSameDate(date, new Date()),
        isCurrentMonth: date.getMonth() === month,
        events: dayEvents,
        eventCount: dayEvents.length,
      });
    }
  }

  selectDayFromMonth(day: MonthDay): void {
    this.selectedDate.set(day.date);
    this.viewMode = 'day';
    this.updateCalendarView();
  }
}
