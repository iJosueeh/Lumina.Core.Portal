import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent, UpcomingEvent } from '@features/student/domain/models/calendar-event.model';
import { GetStudentScheduleUseCase } from '@features/student/application/use-cases/get-student-schedule.usecase';
import { GetUpcomingEventsUseCase } from '@features/student/application/use-cases/get-upcoming-events.usecase';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { AddEventModalComponent } from './add-event-modal.component';
import { getMockSchedule, getMockUpcomingEvents } from '@core/mock-data/schedule.mock';

type ViewMode = 'day' | 'week' | 'month';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, AddEventModalComponent],
  templateUrl: './schedule.component.html',
  styles: ``,
})
export class ScheduleComponent implements OnInit {
  currentMonth = 'Diciembre 2024';
  currentWeek = 'Semana 52';
  viewMode: ViewMode = 'week';
  isLoading = false;
  errorMessage = '';
  showAddEventModal = signal(false);

  weekDays = [
    { name: 'LUN', date: 23, isToday: false },
    { name: 'MAR', date: 24, isToday: false },
    { name: 'MIÉ', date: 25, isToday: false },
    { name: 'JUE', date: 26, isToday: false },
    { name: 'VIE', date: 27, isToday: true },
    { name: 'SÁB', date: 28, isToday: false },
    { name: 'DOM', date: 29, isToday: false },
  ];

  timeSlots = [
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  events: CalendarEvent[] = [];
  upcomingEvents: UpcomingEvent[] = [];

  constructor(
    private getStudentScheduleUseCase: GetStudentScheduleUseCase,
    private getUpcomingEventsUseCase: GetUpcomingEventsUseCase,
    private authRepository: AuthRepository,
  ) {
    console.log('🔧 ScheduleComponent constructor ejecutado');
  }

  ngOnInit(): void {
    console.log('🔧 ScheduleComponent ngOnInit ejecutado');
    this.initializeWeekDays();
    this.loadSchedule();
  }

  private loadSchedule(): void {
    console.log('📅 Cargando horario desde datos mock');
    this.isLoading = true;
    this.errorMessage = '';

    // Simular delay de carga
    setTimeout(() => {
      try {
        // Cargar horario desde mock data
        this.events = getMockSchedule();
        console.log('✅ Horario cargado:', this.events);
        console.log('📊 Total de eventos:', this.events.length);

        // Cargar eventos próximos
        this.upcomingEvents = getMockUpcomingEvents();
        console.log('✅ Eventos próximos cargados:', this.upcomingEvents);

        this.isLoading = false;
      } catch (err) {
        console.error('❌ Error cargando horario:', err);
        this.errorMessage = 'Error al cargar el horario. Intenta nuevamente.';
        this.isLoading = false;
      }
    }, 500);
  }

  private initializeWeekDays(): void {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

    // Calcular el lunes de esta semana
    const monday = new Date(today);
    const diff = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    monday.setDate(today.getDate() + diff);

    // Actualizar weekDays con fechas reales
    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    this.weekDays = dayNames.map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name,
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
      };
    });

    // Actualizar mes y semana actuales
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    this.currentMonth = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const weekNumber = this.getWeekNumber(today);
    this.currentWeek = `Semana ${weekNumber}: Visualizando horario regular`;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  previousWeek(): void {
    // Retroceder una semana
    const firstDay = this.weekDays[0];
    const currentMonday = new Date();
    currentMonday.setDate(firstDay.date);
    currentMonday.setDate(currentMonday.getDate() - 7);

    this.updateWeekDays(currentMonday);
  }

  nextWeek(): void {
    // Avanzar una semana
    const firstDay = this.weekDays[0];
    const currentMonday = new Date();
    currentMonday.setDate(firstDay.date);
    currentMonday.setDate(currentMonday.getDate() + 7);

    this.updateWeekDays(currentMonday);
  }

  private updateWeekDays(monday: Date): void {
    const today = new Date();
    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    this.weekDays = dayNames.map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name,
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
      };
    });

    // Actualizar mes y semana
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    this.currentMonth = `${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
    const weekNumber = this.getWeekNumber(monday);
    this.currentWeek = `Semana ${weekNumber}: Visualizando horario regular`;
  }

  createEvent(): void {
    console.log('Opening add event modal');
    this.showAddEventModal.set(true);
  }

  closeAddEventModal(): void {
    this.showAddEventModal.set(false);
  }

  onEventAdded(event: CalendarEvent): void {
    console.log('New event added:', event);
    // Recargar eventos desde localStorage
    this.events = getMockSchedule();
    this.upcomingEvents = getMockUpcomingEvents();
  }

  getEventPosition(event: CalendarEvent): { top: string; height: string } {
    const startHour = parseInt(event.startTime.split(':')[0]);
    const endHour = parseInt(event.endTime.split(':')[0]);
    const startMinutes = parseInt(event.startTime.split(':')[1]);
    const endMinutes = parseInt(event.endTime.split(':')[1]);

    const baseHour = 7; // 07:00 es la primera hora
    const top = (startHour - baseHour) * 60 + startMinutes;
    const durationHours = endHour - startHour;
    const durationMinutes = endMinutes - startMinutes;
    const height = durationHours * 60 + durationMinutes;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  }

  getEventsForDay(dayIndex: number): CalendarEvent[] {
    return this.events.filter((e) => e.dayOfWeek === dayIndex);
  }
}
