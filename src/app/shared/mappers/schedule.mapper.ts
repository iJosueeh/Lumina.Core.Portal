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
      Lunes: 0, Martes: 1, Miércoles: 2, Miercoles: 2, Jueves: 3, Viernes: 4, Sábado: 5, Sabado: 5, Domingo: 6,
      lunes: 0, martes: 1, miércoles: 2, miercoles: 2, jueves: 3, viernes: 4, sábado: 5, sabado: 5, domingo: 6,
    };

    cursos.forEach((curso) => {
      if (!curso.horarios) return;

      curso.horarios.forEach((horario: Horario) => {
        const dayOfWeek = daysMap[horario.diaSemana] ?? 0;
        const eventDate = DateUtils.getDateInCurrentWeek(dayOfWeek);

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
  generateUpcomingEvents(events: CalendarEvent[], limit?: number): UpcomingEvent[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = events
      .filter((event) => {
        const evDate = new Date(event.date);
        evDate.setHours(0, 0, 0, 0);
        return evDate >= today;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const items = limit ? filtered.slice(0, limit) : filtered;

    return items.map((event) => {
      const diffMs = event.date.getTime() - new Date().getTime();
      const daysUntilNum = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const daysUntil = daysUntilNum <= 0 ? 'Hoy' : daysUntilNum === 1 ? 'Mañana' : `En ${daysUntilNum} días`;
      const typeLabel = event.type === 'class' ? 'Clase' : event.type === 'exam' ? 'Evaluación' : event.type === 'workshop' ? 'Taller' : 'Sesión';

      return {
        id: event.id,
        title: event.title,
        course: `${typeLabel} • ${event.location || (event.locationType === 'virtual' ? 'Virtual' : 'Presencial')}`,
        location: event.location,
        locationType: event.locationType,
        professor: event.professor,
        type: event.type,
        color: event.color,
        date: event.date,
        time: `${event.startTime} - ${event.endTime}`,
        month: event.date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase(),
        day: event.date.getDate(),
        daysUntil: daysUntil,
      };
    });
  }
}
