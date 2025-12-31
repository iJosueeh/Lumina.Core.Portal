import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent, UpcomingEvent } from '@features/student/domain/models/calendar-event.model';
import { GetStudentScheduleUseCase } from '@features/student/application/use-cases/get-student-schedule.usecase';
import { GetUpcomingEventsUseCase } from '@features/student/application/use-cases/get-upcoming-events.usecase';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

type ViewMode = 'day' | 'week' | 'month';

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './schedule.component.html',
    styles: ``
})
export class ScheduleComponent implements OnInit {
    currentMonth = 'Diciembre 2024';
    currentWeek = 'Semana 52';
    viewMode: ViewMode = 'week';
    isLoading = false;
    errorMessage = '';

    weekDays = [
        { name: 'LUN', date: 23, isToday: false },
        { name: 'MAR', date: 24, isToday: false },
        { name: 'MIÉ', date: 25, isToday: false },
        { name: 'JUE', date: 26, isToday: false },
        { name: 'VIE', date: 27, isToday: true },
        { name: 'SÁB', date: 28, isToday: false },
        { name: 'DOM', date: 29, isToday: false }
    ];

    timeSlots = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    events: CalendarEvent[] = [];
    upcomingEvents: UpcomingEvent[] = [];

    constructor(
        private getStudentScheduleUseCase: GetStudentScheduleUseCase,
        private getUpcomingEventsUseCase: GetUpcomingEventsUseCase,
        private authRepository: AuthRepository
    ) { 
        console.log('🔧 ScheduleComponent constructor ejecutado');
    }

    ngOnInit(): void {
        console.log('🔧 ScheduleComponent ngOnInit ejecutado');
        this.initializeWeekDays();
        this.loadSchedule();
    }

    private loadSchedule(): void {
        const currentUser = this.authRepository.getCurrentUser();
        if (!currentUser) {
            console.warn('⚠️ No hay usuario autenticado');
            this.errorMessage = 'No se pudo obtener la información del usuario';
            this.isLoading = false;
            return;
        }

        console.log('📅 Cargando horario para estudiante:', currentUser.id);
        this.isLoading = true;
        this.errorMessage = '';

        // Cargar horario
        this.getStudentScheduleUseCase.execute(currentUser.id).subscribe({
            next: (events) => {
                console.log('✅ Horario cargado:', events);
                console.log('📊 Total de eventos:', events.length);
                this.events = events;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('❌ Error cargando horario:', err);
                console.error('❌ Status:', err.status);
                console.error('❌ Message:', err.message);
                
                // No mostrar error si es 404 o array vacío, solo mostrar calendario vacío
                if (err.status === 404 || err.status === 400) {
                    console.warn('⚠️ No hay horarios disponibles, mostrando calendario vacío');
                    this.events = [];
                    this.isLoading = false;
                } else {
                    this.errorMessage = 'Error al cargar el horario. Intenta nuevamente.';
                    this.isLoading = false;
                }
            }
        });

        // Cargar eventos próximos
        this.getUpcomingEventsUseCase.execute(currentUser.id).subscribe({
            next: (events) => {
                console.log('✅ Eventos próximos cargados:', events);
                console.log('📊 Total de eventos próximos:', events.length);
                this.upcomingEvents = events;
            },
            error: (err) => {
                console.error('❌ Error cargando eventos próximos:', err);
                // No mostrar error, solo dejar la lista vacía
                this.upcomingEvents = [];
            }
        });
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
                isToday: date.toDateString() === today.toDateString()
            };
        });

        // Actualizar mes y semana actuales
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
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
        // TODO: Implementar navegación de semanas
        console.log('Previous week');
    }

    nextWeek(): void {
        // TODO: Implementar navegación de semanas
        console.log('Next week');
    }

    syncWithGoogle(): void {
        console.log('Sync with Google Calendar');
    }

    createEvent(): void {
        console.log('Create new event');
    }

    getEventPosition(event: CalendarEvent): { top: string; height: string } {
        const startHour = parseInt(event.startTime.split(':')[0]);
        const endHour = parseInt(event.endTime.split(':')[0]);
        const startMinutes = parseInt(event.startTime.split(':')[1]);
        const endMinutes = parseInt(event.endTime.split(':')[1]);

        const baseHour = 7; // 07:00 es la primera hora
        const top = ((startHour - baseHour) * 60) + startMinutes;
        const durationHours = endHour - startHour;
        const durationMinutes = endMinutes - startMinutes;
        const height = (durationHours * 60) + durationMinutes;

        return {
            top: `${top}px`,
            height: `${height}px`
        };
    }

    getEventsForDay(dayIndex: number): CalendarEvent[] {
        return this.events.filter(e => e.dayOfWeek === dayIndex);
    }
}
