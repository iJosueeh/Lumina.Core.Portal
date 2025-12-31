export interface CalendarEvent {
  id: string;
  title: string;
  type: 'class' | 'exam' | 'workshop' | 'meeting';
  startTime: string;
  endTime: string;
  location: string;
  locationType: 'virtual' | 'presencial';
  color: string;
  dayOfWeek: number; // 0 = Lun, 1 = Mar, etc.
  date: Date;
  isUrgent?: boolean;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  course: string;
  date: Date;
  time: string;
  month: string;
  day: number;
  daysUntil: string;
}
