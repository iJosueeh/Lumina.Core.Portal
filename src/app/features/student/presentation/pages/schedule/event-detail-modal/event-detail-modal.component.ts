import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '@features/student/domain/models/calendar-event.model';

@Component({
  selector: 'app-event-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-detail-modal.component.html',
  styleUrl: './event-detail-modal.component.css'
})
export class EventDetailModalComponent {
  @Input({ required: true }) event!: CalendarEvent;
  @Output() close = new EventEmitter<void>();

  getTypeLabel(type?: string): string {
    switch (type?.toLowerCase()) {
      case 'class': return 'Clase';
      case 'exam': return 'Evaluación';
      case 'workshop': return 'Taller';
      case 'meeting': return 'Mentoría / Sesión';
      default: return 'Sesión Académica';
    }
  }
}
