import { CalendarEvent, UpcomingEvent } from '@features/student/domain/models/calendar-event.model';

// Datos mock de horario semanal
export const MOCK_SCHEDULE_EVENTS: CalendarEvent[] = [
  // LUNES
  {
    id: '1',
    title: 'Programación Avanzada',
    type: 'class',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Aula 301',
    locationType: 'presencial',
    color: 'bg-blue-600',
    dayOfWeek: 0, // Lunes
    date: new Date(2026, 0, 13, 8, 0), // Lunes 13 de enero 2026
    isUrgent: false,
  },
  {
    id: '2',
    title: 'Base de Datos II',
    type: 'class',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Lab 205',
    locationType: 'presencial',
    color: 'bg-green-600',
    dayOfWeek: 0,
    date: new Date(2026, 0, 13, 10, 0),
    isUrgent: false,
  },
  {
    id: '3',
    title: 'Arquitectura de Software',
    type: 'class',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Google Meet',
    locationType: 'virtual',
    color: 'bg-purple-600',
    dayOfWeek: 0,
    date: new Date(2026, 0, 13, 14, 0),
    isUrgent: false,
  },

  // MARTES
  {
    id: '4',
    title: 'Ingeniería de Software',
    type: 'class',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Aula 402',
    locationType: 'presencial',
    color: 'bg-indigo-600',
    dayOfWeek: 1, // Martes
    date: new Date(2026, 0, 14, 8, 0),
    isUrgent: false,
  },
  {
    id: '5',
    title: 'Taller de Desarrollo Web',
    type: 'workshop',
    startTime: '10:00',
    endTime: '13:00',
    location: 'Lab 101',
    locationType: 'presencial',
    color: 'bg-orange-600',
    dayOfWeek: 1,
    date: new Date(2026, 0, 14, 10, 0),
    isUrgent: false,
  },
  {
    id: '6',
    title: 'Reunión con Asesor de Tesis',
    type: 'meeting',
    startTime: '15:00',
    endTime: '16:00',
    location: 'Oficina 203',
    locationType: 'presencial',
    color: 'bg-yellow-600',
    dayOfWeek: 1,
    date: new Date(2026, 0, 14, 15, 0),
    isUrgent: false,
  },

  // MIÉRCOLES
  {
    id: '7',
    title: 'Programación Avanzada',
    type: 'class',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Aula 301',
    locationType: 'presencial',
    color: 'bg-blue-600',
    dayOfWeek: 2, // Miércoles
    date: new Date(2026, 0, 15, 8, 0),
    isUrgent: false,
  },
  {
    id: '8',
    title: 'Examen Parcial - Base de Datos II',
    type: 'exam',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Aula Magna',
    locationType: 'presencial',
    color: 'bg-red-600',
    dayOfWeek: 2,
    date: new Date(2026, 0, 15, 10, 0),
    isUrgent: true,
  },
  {
    id: '9',
    title: 'Metodologías Ágiles',
    type: 'class',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Zoom',
    locationType: 'virtual',
    color: 'bg-teal-600',
    dayOfWeek: 2,
    date: new Date(2026, 0, 15, 14, 0),
    isUrgent: false,
  },

  // JUEVES
  {
    id: '10',
    title: 'Base de Datos II',
    type: 'class',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Lab 205',
    locationType: 'presencial',
    color: 'bg-green-600',
    dayOfWeek: 3, // Jueves
    date: new Date(2026, 0, 16, 8, 0),
    isUrgent: false,
  },
  {
    id: '11',
    title: 'Arquitectura de Software',
    type: 'class',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Aula 305',
    locationType: 'presencial',
    color: 'bg-purple-600',
    dayOfWeek: 3,
    date: new Date(2026, 0, 16, 10, 0),
    isUrgent: false,
  },
  {
    id: '12',
    title: 'Lab de Redes',
    type: 'workshop',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Lab 303',
    locationType: 'presencial',
    color: 'bg-cyan-600',
    dayOfWeek: 3,
    date: new Date(2026, 0, 16, 14, 0),
    isUrgent: false,
  },

  // VIERNES
  {
    id: '13',
    title: 'Ingeniería de Software',
    type: 'class',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Aula 402',
    locationType: 'presencial',
    color: 'bg-indigo-600',
    dayOfWeek: 4, // Viernes
    date: new Date(2026, 0, 17, 8, 0),
    isUrgent: false,
  },
  {
    id: '14',
    title: 'Presentación de Proyecto Final',
    type: 'exam',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Auditorio',
    locationType: 'presencial',
    color: 'bg-red-600',
    dayOfWeek: 4,
    date: new Date(2026, 0, 17, 10, 0),
    isUrgent: true,
  },
  {
    id: '15',
    title: 'Metodologías Ágiles',
    type: 'class',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Aula 201',
    locationType: 'presencial',
    color: 'bg-teal-600',
    dayOfWeek: 4,
    date: new Date(2026, 0, 17, 14, 0),
    isUrgent: false,
  },
];

// Eventos próximos
export const MOCK_UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: '8',
    title: 'Examen Parcial',
    course: 'Base de Datos II',
    date: new Date(2026, 0, 15, 10, 0),
    time: '10:00 AM',
    month: 'ENE',
    day: 15,
    daysUntil: 'En 2 días',
  },
  {
    id: '14',
    title: 'Presentación Proyecto',
    course: 'Ingeniería de Software',
    date: new Date(2026, 0, 17, 10, 0),
    time: '10:00 AM',
    month: 'ENE',
    day: 17,
    daysUntil: 'En 4 días',
  },
  {
    id: '16',
    title: 'Entrega de Trabajo',
    course: 'Arquitectura de Software',
    date: new Date(2026, 0, 20, 23, 59),
    time: '11:59 PM',
    month: 'ENE',
    day: 20,
    daysUntil: 'En 7 días',
  },
];

// Helper functions
export function getMockSchedule(): CalendarEvent[] {
  const stored = localStorage.getItem('student_schedule');
  if (stored) {
    const events = JSON.parse(stored);
    // Convertir strings de fecha a objetos Date
    return events.map((e: any) => ({
      ...e,
      date: new Date(e.date),
    }));
  }
  return [...MOCK_SCHEDULE_EVENTS];
}

export function saveMockSchedule(events: CalendarEvent[]): void {
  localStorage.setItem('student_schedule', JSON.stringify(events));
}

export function getMockUpcomingEvents(): UpcomingEvent[] {
  return [...MOCK_UPCOMING_EVENTS];
}

export function addMockEvent(event: CalendarEvent): CalendarEvent[] {
  const currentEvents = getMockSchedule();
  const newEvent = {
    ...event,
    id: Date.now().toString(), // Generar ID único
  };
  const updatedEvents = [...currentEvents, newEvent];
  saveMockSchedule(updatedEvents);
  return updatedEvents;
}

export function deleteMockEvent(eventId: string): CalendarEvent[] {
  const currentEvents = getMockSchedule();
  const updatedEvents = currentEvents.filter((e) => e.id !== eventId);
  saveMockSchedule(updatedEvents);
  return updatedEvents;
}
