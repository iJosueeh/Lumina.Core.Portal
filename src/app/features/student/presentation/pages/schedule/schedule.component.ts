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
import { map, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { CoursesService } from '@features/student/infrastructure/services/courses.service';
import { CursoConHorarios, Horario } from '@features/student/domain/models/horario.model';

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

  constructor(
    private http: HttpClient,
    private coursesService: CoursesService,
  ) {
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    this.updateCalendarView();
    this.loadSchedule();
  }

  private loadSchedule(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Cargar cursos desde la API
    this.coursesService
      .getAllCourses()
      .pipe(
        switchMap((cursos) => {
          if (cursos.length === 0) {
            return of([]);
          }
          // Obtener detalles de todos los cursos en paralelo
          const coursesDetails$ = cursos.map((curso) =>
            this.coursesService.getCourseById(curso.id),
          );
          return forkJoin(coursesDetails$);
        }),
      )
      .subscribe({
        next: (cursosConDetalles) => {
          // Transformar horarios a eventos del calendario
          const events = this.transformSchedulesToEvents(
            cursosConDetalles.filter((c) => c !== null) as CursoConHorarios[],
          );
          this.events = events;
          this.filteredEvents = events;
          this.generateUpcomingEvents(events);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading schedule:', err);
          this.errorMessage = 'Error al cargar los horarios desde el servidor.';
          this.isLoading = false;
        },
      });
  }

  /**
   * Transforma los horarios de los cursos a eventos del calendario
   */
  private transformSchedulesToEvents(cursos: CursoConHorarios[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const daysMap: { [key: string]: number } = {
      Lunes: 0,
      Martes: 1,
      Miércoles: 2,
      Jueves: 3,
      Viernes: 4,
      Sábado: 5,
      Domingo: 6,
    };

    cursos.forEach((curso) => {
      if (!curso.horarios || curso.horarios.length === 0) return;

      curso.horarios.forEach((horario) => {
        const dayOfWeek = daysMap[horario.diaSemana] ?? 0;
        const eventDate = this.getNextDateForDay(dayOfWeek);

        const event: CalendarEvent = {
          id: `${curso.id}-${horario.id}`,
          title: curso.titulo,
          type: this.mapSessionType(horario.tipoSesion),
          startTime: horario.horaInicio,
          endTime: horario.horaFin,
          location: horario.ubicacion,
          locationType: horario.modalidad === 'Virtual' ? 'virtual' : 'presencial',
          color: this.getColorForModalidad(horario.modalidad),
          dayOfWeek: dayOfWeek,
          date: eventDate,
          professor: curso.instructor?.nombre,
          description: curso.descripcion,
          meetingLink: horario.enlaceVirtual,
        };

        events.push(event);
      });
    });

    return events;
  }

  /**
   * Obtiene la próxima fecha para un día de la semana específico
   */
  private getNextDateForDay(targetDayOfWeek: number): Date {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    
    // Convertir nuestro índice (0=Lunes) a índice de JS (1=Lunes)
    const jsTargetDay = targetDayOfWeek === 6 ? 0 : targetDayOfWeek + 1;
    
    // Calcular días hasta el objetivo
    let daysUntilTarget = jsTargetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Siguiente semana
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate;
  }

  /**
   * Mapea el tipo de sesión a tipo de evento
   */
  private mapSessionType(tipoSesion: string): 'class' | 'exam' | 'workshop' | 'meeting' {
    const tipo = tipoSesion.toLowerCase();
    if (tipo.includes('examen') || tipo.includes('evaluación')) return 'exam';
    if (tipo.includes('taller') || tipo.includes('laboratorio')) return 'workshop';
    if (tipo.includes('reunión') || tipo.includes('tutoría')) return 'meeting';
    return 'class';
  }

  /**
   * Obtiene el color según la modalidad
   */
  private getColorForModalidad(modalidad: string): string {
    switch (modalidad) {
      case 'Virtual':
        return 'bg-blue-500';
      case 'Presencial':
        return 'bg-green-500';
      case 'Híbrido':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  }

  /**
   * Genera eventos próximos desde los eventos del calendario
   */
  private generateUpcomingEvents(events: CalendarEvent[]): void {
    const today = new Date();
    const upcomingEvents: UpcomingEvent[] = events
      .filter((event) => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map((event) => {
        const daysUntil = Math.ceil(
          (event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          id: event.id,
          title: event.title,
          course: event.title,
          date: event.date,
          time: `${event.startTime} - ${event.endTime}`,
          month: event.date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
          day: event.date.getDate(),
          daysUntil: daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`,
        };
      });

    this.upcomingEvents = upcomingEvents;
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
