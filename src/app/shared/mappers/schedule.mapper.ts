import { Injectable } from '@angular/core';
import { CalendarEvent, UpcomingEvent } from '@features/student/domain/models/calendar-event.model';
import { CursoConHorarios, Horario } from '@features/student/domain/models/horario.model';
import { DateUtils } from '../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class ScheduleMapper {
  
  /**
   * Transforms course schedules to calendar events.
   */
  transformSchedulesToEvents(cursos: CursoConHorarios[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const daysMap: { [key: string]: number } = {
      Lunes: 0, Martes: 1, Miércoles: 2, Jueves: 3, Viernes: 4, Sábado: 5, Domingo: 6,
    };

    cursos.forEach((curso) => {
      if (!curso.horarios) return;

      curso.horarios.forEach((horario: Horario) => {
        const dayOfWeek = daysMap[horario.diaSemana] ?? 0;
        const eventDate = DateUtils.getNextDateForDay(dayOfWeek);

        events.push({
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
        });
      });
    });

    return events;
  }

  /**
   * Maps session type to event type.
   */
  private mapSessionType(tipoSesion: string): 'class' | 'exam' | 'workshop' | 'meeting' {
    const tipo = (tipoSesion || '').toLowerCase();
    if (tipo.includes('examen') || tipo.includes('evaluación')) return 'exam';
    if (tipo.includes('taller') || tipo.includes('laboratorio')) return 'workshop';
    if (tipo.includes('reunión') || tipo.includes('tutoría')) return 'meeting';
    return 'class';
  }

  /**
   * Gets color based on modality.
   */
  private getColorForModalidad(modalidad: string): string {
    switch (modalidad) {
      case 'Virtual': return 'bg-blue-500';
      case 'Presencial': return 'bg-green-500';
      case 'Híbrido': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }

  /**
   * Generates upcoming events from calendar events.
   */
  generateUpcomingEvents(events: CalendarEvent[]): UpcomingEvent[] {
    const today = new Date();
    return events
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
  }
}
