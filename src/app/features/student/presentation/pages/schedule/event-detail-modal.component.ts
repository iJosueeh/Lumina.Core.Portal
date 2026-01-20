import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '@features/student/domain/models/calendar-event.model';

@Component({
  selector: 'app-event-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      (click)="close.emit()"
    >
      <div
        class="bg-[#1a2942] rounded-xl border border-teal-500/20 max-w-2xl w-full"
        (click)="$event.stopPropagation()"
      >
        <!-- Header con color del evento -->
        <div [class]="event.color + ' p-6 rounded-t-xl'">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-white">{{ event.title }}</h2>
              @if (event.professor) {
                <p class="text-white/80 mt-1">{{ event.professor }}</p>
              }
              <span
                class="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white uppercase"
              >
                {{ getEventTypeLabel(event.type) }}
              </span>
            </div>
            <button (click)="close.emit()" class="text-white/80 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Detalles -->
        <div class="p-6 space-y-4">
          <!-- Fecha y hora -->
          <div class="flex items-center gap-3 text-gray-300">
            <svg class="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clip-rule="evenodd"
              />
            </svg>
            <span>{{ formatDate(event.date) }} • {{ event.startTime }} - {{ event.endTime }}</span>
          </div>

          <!-- Ubicación -->
          <div class="flex items-center gap-3 text-gray-300">
            @if (event.locationType === 'virtual') {
              <svg class="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z"
                />
              </svg>
            }
            @if (event.locationType === 'presencial') {
              <svg class="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clip-rule="evenodd"
                />
              </svg>
            }
            <div class="flex-1">
              <span>{{ event.location }}</span>
              <span class="ml-2 text-xs text-gray-500"
                >({{ event.locationType === 'virtual' ? 'Virtual' : 'Presencial' }})</span
              >
            </div>
          </div>

          <!-- Descripción -->
          @if (event.description) {
            <div class="text-gray-300">
              <h3 class="font-semibold text-white mb-2 flex items-center gap-2">
                <svg class="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                    clip-rule="evenodd"
                  />
                </svg>
                Descripción
              </h3>
              <p class="text-sm leading-relaxed">{{ event.description }}</p>
            </div>
          }

          <!-- Urgente Badge -->
          @if (event.isUrgent) {
            <div
              class="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="text-red-400 font-semibold text-sm">Evento Urgente</span>
            </div>
          }

          <!-- Acciones -->
          <div class="flex gap-3 pt-4 border-t border-teal-500/20">
            @if (event.locationType === 'virtual' && event.meetingLink) {
              <button
                (click)="joinMeeting()"
                class="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z"
                  />
                </svg>
                Unirse a la clase
              </button>
            }
            <button
              (click)="close.emit()"
              class="px-6 py-3 bg-[#0a1628] border border-teal-500/30 rounded-lg text-gray-300 font-semibold hover:bg-teal-500/10 hover:border-teal-500/50 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class EventDetailModalComponent {
  @Input() event!: CalendarEvent;
  @Output() close = new EventEmitter<void>();

  getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      class: 'Clase',
      exam: 'Examen',
      workshop: 'Taller',
      meeting: 'Reunión',
    };
    return labels[type] || type;
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  }

  joinMeeting(): void {
    if (this.event.meetingLink) {
      window.open(this.event.meetingLink, '_blank');
    }
  }
}
