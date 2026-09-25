import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap, catchError, finalize } from 'rxjs';
import { CalendarEvent, UpcomingEvent, MonthDay } from '@features/student/domain/models/calendar-event.model';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';
import { CursoConHorarios } from '@features/student/domain/models/horario.model';
import { AddEventModalComponent } from '../add-event-modal/add-event-modal.component';
import { EventDetailModalComponent } from '../event-detail-modal/event-detail-modal.component';
import { AllTasksModalComponent } from '../all-tasks-modal/all-tasks-modal.component';
import { CoursesService } from '@features/student/infrastructure/services/courses.service';
import { EnrollmentService } from '@features/student/infrastructure/services/enrollment.service';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { GetStudentCoursesUseCase } from '@features/student/application/use-cases/get-student-courses.usecase';
import { GetStudentScheduleUseCase } from '@features/student/application/use-cases/get-student-schedule.usecase';
import { DateUtils } from '../../../../../../shared/utils/date.utils';
import { ScheduleMapper } from '../../../../../../shared/mappers/schedule.mapper';

type ViewMode = 'day' | 'week' | 'month';

interface WeekDay {
  name: string;
  fullName: string;
  date: string;
  fullDate: Date;
  isToday: boolean;
  isSelected: boolean;
  eventCount: number;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEventModalComponent, EventDetailModalComponent, AllTasksModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css',
  host: {
    class: 'block w-full min-w-0 max-w-full overflow-x-hidden'
  }
})
export class ScheduleComponent implements OnInit {
  private coursesService = inject(CoursesService);
  private enrollmentService = inject(EnrollmentService);
  private authRepository = inject(AuthRepository);
  private getCoursesUseCase = inject(GetStudentCoursesUseCase);
  private getScheduleUseCase = inject(GetStudentScheduleUseCase);
  private mapper = inject(ScheduleMapper);

  viewMode = signal<ViewMode>('week');
  selectedDate = signal(new Date());
  events = signal<CalendarEvent[]>([]);
  allUpcomingEvents = signal<UpcomingEvent[]>([]);
  upcomingEvents = computed(() => this.allUpcomingEvents().slice(0, 5));
  searchQuery = signal('');
  isLoading = signal(false);
  showAddEventModal = signal(false);
  showEventDetailModal = signal(false);
  showAllTasksModal = signal(false);
  selectedEvent = signal<CalendarEvent | null>(null);

  weekDays = signal<WeekDay[]>([]);
  monthDays = signal<MonthDay[]>([]);
  timeSlots: string[] = [];

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.events().filter(e =>
      !query || e.title.toLowerCase().includes(query) || (e.location?.toLowerCase().includes(query))
    );
  });

  currentMonth = computed(() => DateUtils.formatMonthYear(this.selectedDate()));

  selectedDayTitle = computed(() => {
    const sel = this.selectedDate();
    const dayName = sel.toLocaleDateString('es-ES', { weekday: 'long' });
    const dayNumber = sel.getDate();
    const monthName = sel.toLocaleDateString('es-ES', { month: 'long' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNumber} de ${monthName}`;
  });

  currentWeek = computed(() => {
    const current = this.selectedDate();
    if (this.viewMode() === 'day') {
      return this.selectedDayTitle();
    }
    if (this.viewMode() === 'month') return this.currentMonth();
    const start = new Date(current);
    start.setDate(current.getDate() - (current.getDay() === 0 ? 6 : current.getDay() - 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `Semana del ${start.getDate()} al ${end.getDate()} de ${this.currentMonth()}`;
  });

  ngOnInit() {
    this.generateTimeSlots();
    this.updateView();
    this.loadData();
  }

  private loadData() {
    const user = this.authRepository.getCurrentUser();
    if (!user) {
      this.isLoading.set(false);
      this.events.set([]);
      this.allUpcomingEvents.set([]);
      this.updateView();
      return;
    }

    this.isLoading.set(true);

    // 1. Resolver studentId de forma resiliente
    this.enrollmentService.getStudentIdByUserId(user.id).pipe(
      switchMap(studentId => {
        const idToQuery = studentId || user.id;
        return forkJoin({
          enrolledCourses: this.getCoursesUseCase.execute(idToQuery).pipe(
            catchError(() => of([] as CourseProgress[]))
          ),
          allCoursesWithSchedules: this.coursesService.getAllCoursesWithSchedules().pipe(
            catchError(() => of([] as CursoConHorarios[]))
          ),
          programaciones: this.getScheduleUseCase.execute(idToQuery).pipe(
            catchError(() => of([] as CalendarEvent[]))
          )
        });
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.updateView();
      })
    ).subscribe({
      next: ({ enrolledCourses, allCoursesWithSchedules, programaciones }) => {
        let evs: CalendarEvent[] = [];

        // 1. Horarios de cursos matriculados
        if (enrolledCourses && enrolledCourses.length > 0) {
          const enrolledIds = new Set(enrolledCourses.map(c => String(c.id).toLowerCase()));
          const studentCourses = allCoursesWithSchedules.filter(c => 
            enrolledIds.has(String(c.id).toLowerCase())
          );
          const courseEvents = this.mapper.transformSchedulesToEvents(studentCourses);
          evs = [...courseEvents];
        }

        // 2. Programaciones y eventos de calendario del estudiante
        if (programaciones && programaciones.length > 0) {
          const existingIds = new Set(evs.map(e => e.id));
          programaciones.forEach(prog => {
            if (!existingIds.has(prog.id)) {
              evs.push(prog);
              existingIds.add(prog.id);
            }
          });
        }

        this.events.set(evs);
        this.allUpcomingEvents.set(this.mapper.generateUpcomingEvents(evs));
        this.updateView();
      },
      error: () => {
        this.events.set([]);
        this.allUpcomingEvents.set([]);
        this.updateView();
      }
    });
  }

  private updateView() {
    const current = this.selectedDate();
    this.generateWeekDays(current);
    if (this.viewMode() === 'month') {
      this.generateMonthView();
    }
  }

  private generateWeekDays(current: Date) {
    const start = new Date(current);
    start.setDate(current.getDate() - (current.getDay() === 0 ? 6 : current.getDay() - 1));
    const shortNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    const fullNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    this.weekDays.set(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dayEvs = this.filteredEvents().filter(e => e.dayOfWeek === i || DateUtils.isSameDate(e.date, d));
      return {
        name: shortNames[i],
        fullName: fullNames[i],
        date: d.getDate().toString(),
        fullDate: d,
        isToday: DateUtils.isSameDate(d, new Date()),
        isSelected: DateUtils.isSameDate(d, this.selectedDate()),
        eventCount: dayEvs.length
      };
    }));
  }

  selectDay(day: WeekDay) {
    this.selectedDate.set(day.fullDate);
    this.updateView();
  }

  selectDayAndSwitchToDayView(day: WeekDay) {
    this.selectedDate.set(day.fullDate);
    this.viewMode.set('day');
    this.updateView();
  }


  private generateMonthView() {
    const d = this.selectedDate();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
    this.monthDays.set(Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayEvs = this.filteredEvents().filter(e => DateUtils.isSameDate(e.date, date));
      return { date, number: date.getDate(), isToday: DateUtils.isSameDate(date, new Date()), isCurrentMonth: date.getMonth() === d.getMonth(), events: dayEvs, eventCount: dayEvs.length };
    }));
  }

  private generateTimeSlots() {
    this.timeSlots = Array.from({ length: 16 }, (_: unknown, i: number) => `${(i + 7).toString().padStart(2, '0')}:00`);
  }

  getEventsForDay(dayIndex: number) {
    return this.filteredEvents().filter(e => e.dayOfWeek === dayIndex);
  }

  getDayEvents() {
    return this.filteredEvents().filter(e => DateUtils.isSameDate(e.date, this.selectedDate()));
  }

  // Layout calculado con detección de colisiones
  eventLayout = computed(() => {
    const events = this.filteredEvents();
    const layout: { [dayIndex: number]: Array<{event: CalendarEvent, col: number, colSpan: number}> } = {};

    // Inicializar por día (0=Lunes a 6=Domingo)
    for (let i = 0; i < 7; i++) {
      layout[i] = [];
    }

    // Agrupar eventos por día
    const byDay: { [day: number]: CalendarEvent[] } = {};
    events.forEach(e => {
      if (!byDay[e.dayOfWeek]) byDay[e.dayOfWeek] = [];
      byDay[e.dayOfWeek].push(e);
    });

    // Procesar cada día
    Object.entries(byDay).forEach(([dayStr, dayEvents]) => {
      const day = parseInt(dayStr);
      // Ordenar por hora de inicio
      const sorted = [...dayEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Algoritmo de colisiones: asignar columna a cada evento
      // Events que se cruzan van en columnas distintas
      const columns: CalendarEvent[][] = []; // columns[colIdx] = eventos en esa columna

      sorted.forEach(event => {
        const eventStart = this.timeToMinutes(event.startTime);
        const eventEnd = this.timeToMinutes(event.endTime);

        // Buscar primera columna donde no hay conflicto
        let placed = false;
        for (let col = 0; col < columns.length; col++) {
          const hasConflict = columns[col].some(existing => {
            const existStart = this.timeToMinutes(existing.startTime);
            const existEnd = this.timeToMinutes(existing.endTime);
            return eventStart < existEnd && eventEnd > existStart;
          });
          if (!hasConflict) {
            columns[col].push(event);
            layout[day].push({ event, col, colSpan: 1 });
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([event]);
          layout[day].push({ event, col: columns.length - 1, colSpan: 1 });
        }
      });

      // Ahora calcular colSpan: eventos que ocupan la misma columna + columnas vacías entre ellos
      // Simplificado: eventos que no se solapan pueden compartir colSpan=1 y posicionarse en paralelo
      // Primero determinamos el total de columnas para este día
      const totalCols = columns.length;
      layout[day].forEach(item => {
        item.colSpan = 1; // Por ahora 1, el width se calcula dinámicamente
        item.col = item.col % totalCols;
      });
    });

    return layout;
  });

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  getLayoutForDay(dayIndex: number) {
    return this.eventLayout()[dayIndex] || [];
  }

  getEventStyle(layoutItem: {event: CalendarEvent, col: number, colSpan: number}, totalCols: number) {
    const [sh, sm] = layoutItem.event.startTime.split(':').map(Number);
    const [eh, em] = layoutItem.event.endTime.split(':').map(Number);
    const pxPerMinute = 64 / 60;
    const top = ((sh - 7) * 60 + sm) * pxPerMinute;
    const height = Math.max(((eh - sh) * 60 + (em - sm)) * pxPerMinute, 36);

    const widthPct = (96 / totalCols);
    const left = 2 + layoutItem.col * widthPct;

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${left}%`,
      width: `${widthPct - 2}%`
    };
  }

  getTotalColsForDay(dayIndex: number): number {
    const layout = this.eventLayout()[dayIndex];
    if (!layout) return 1;
    const cols = new Set(layout.map(l => l.col));
    return Math.max(cols.size, 1);
  }

  changeDate(offset: number) {
    const d = new Date(this.selectedDate());
    if (this.viewMode() === 'day') d.setDate(d.getDate() + offset);
    else if (this.viewMode() === 'month') d.setMonth(d.getMonth() + offset);
    else d.setDate(d.getDate() + offset * 7);
    this.selectedDate.set(d);
    this.updateView();
  }

  selectDayFromMonth(day: MonthDay) {
    this.selectedDate.set(day.date);
    this.viewMode.set('day');
    this.updateView();
  }

  setViewMode(m: ViewMode) { this.viewMode.set(m); this.updateView(); }
  onSearch(q: string) { this.searchQuery.set(q); }
  previousWeek() { this.changeDate(-1); }
  nextWeek() { this.changeDate(1); }

  openEventDetail(event: CalendarEvent) { this.selectedEvent.set(event); this.showEventDetailModal.set(true); }
  closeEventDetailModal() { this.showEventDetailModal.set(false); this.selectedEvent.set(null); }
  closeAddEventModal() { this.showAddEventModal.set(false); }
  openAllTasksModal() { this.showAllTasksModal.set(true); }
  closeAllTasksModal() { this.showAllTasksModal.set(false); }
  onEventAdded(event: CalendarEvent) {
    this.events.update(evs => {
      const updated = [...evs, event];
      this.allUpcomingEvents.set(this.mapper.generateUpcomingEvents(updated));
      return updated;
    });
    this.updateView();
  }
}
