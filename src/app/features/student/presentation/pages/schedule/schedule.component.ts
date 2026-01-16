import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent, UpcomingEvent } from '@features/student/domain/models/calendar-event.model';
import { AddEventModalComponent } from './add-event-modal.component';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

type ViewMode = 'day' | 'week' | 'month';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, AddEventModalComponent],
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

  // Template Helpers
  weekDays: { name: string; date: string; isToday: boolean }[] = [];
  timeSlots: string[] = [];
  currentMonth: string = '';
  currentWeek: string = '';

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

  // --- Calendar Logic ---

  private generateTimeSlots(): void {
    this.timeSlots = Array.from({ length: 14 }, (_, i) => {
      const hour = i + 7; // 7 AM a 8 PM
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  }

  private updateCalendarView(): void {
    const current = this.selectedDate();

    // Calcular inicio de semana (Lunes)
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que Lunes sea el primer día
    const monday = new Date(current);
    monday.setDate(diff);

    // Generar días de la semana
    this.weekDays = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        name: ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][i],
        date: date.getDate().toString(),
        isToday: this.isSameDate(date, new Date()),
      };
    });

    // Actualizar títulos
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    this.currentMonth = current
      .toLocaleDateString('es-ES', options)
      .replace(/^\w/, (c) => c.toUpperCase());

    const endOfWeek = new Date(monday);
    endOfWeek.setDate(monday.getDate() + 5);
    this.currentWeek = `Semana del ${monday.getDate()} al ${endOfWeek.getDate()} de ${this.currentMonth.split(' ')[0]}`;
  }

  private isSameDate(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  // --- Template Methods ---

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode; // Por ahora solo soportamos 'week' visualmente en este mock simple
  }

  previousWeek(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);
    newDate.setDate(current.getDate() - 7);
    this.selectedDate.set(newDate);
    this.updateCalendarView();
  }

  nextWeek(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + 7);
    this.selectedDate.set(newDate);
    this.updateCalendarView();
  }

  getEventsForDay(dayIndex: number): CalendarEvent[] {
    // dayIndex 0 = Lun, 1 = Mar... (según this.weekDays)
    // CalendarEvent.dayOfWeek 0 = Lun
    return this.events.filter((event) => event.dayOfWeek === dayIndex);
  }

  getEventPosition(event: CalendarEvent): { top: string; height: string } {
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);

    const startMinutes = (startHour - 7) * 60 + startMin; // Offset desde las 7 AM
    const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);

    // Asumiendo que cada hora tiene 64px de altura (h-16 en Tailwind)
    // 64px / 60min = ~1.066 px/min
    // Pero usaremos porcentajes relativos a la celda de la hora? No, absolute positioning.
    // El contenedor de cada día tiene height = 14 horas * 64px = 896px.
    // Mejor usar pixeles o rems. h-16 = 4rem = 64px.

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
}
