import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpcomingEvent } from '@features/student/domain/models/calendar-event.model';

type FilterType = 'all' | 'urgent' | 'thisWeek';

@Component({
  selector: 'app-all-tasks-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      (click)="close.emit()"
    >
      <div
        class="bg-[#1a2942] rounded-xl border border-teal-500/20 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="p-6 border-b border-teal-500/20 flex items-center justify-between flex-shrink-0"
        >
          <div>
            <h2 class="text-2xl font-bold text-white">Todas las Tareas</h2>
            <p class="text-gray-400 text-sm mt-1">{{ filteredTasks.length }} tareas encontradas</p>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-white transition-colors">
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

        <!-- Filters -->
        <div class="p-4 border-b border-teal-500/20 flex gap-2 flex-shrink-0 overflow-x-auto">
          @for (filter of filters; track filter.value) {
            <button
              (click)="activeFilter = filter.value"
              [class.bg-gradient-to-r]="activeFilter === filter.value"
              [class.from-teal-500]="activeFilter === filter.value"
              [class.to-cyan-600]="activeFilter === filter.value"
              [class.text-white]="activeFilter === filter.value"
              [class.shadow-lg]="activeFilter === filter.value"
              [class.shadow-teal-500/30]="activeFilter === filter.value"
              [class.text-gray-300]="activeFilter !== filter.value"
              [class.bg-[#0a1628]]="activeFilter !== filter.value"
              [class.border]="activeFilter !== filter.value"
              [class.border-teal-500/30]="activeFilter !== filter.value"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            >
              {{ filter.label }}
            </button>
          }
        </div>

        <!-- Task List -->
        <div class="p-6 overflow-y-auto flex-1">
          @if (filteredTasks.length === 0) {
            <div class="text-center py-12">
              <svg
                class="mx-auto h-16 w-16 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p class="mt-4 text-gray-400">No hay tareas en esta categoría</p>
            </div>
          }

          <div class="space-y-3">
            @for (task of filteredTasks; track task.id) {
              <div
                class="p-4 bg-[#0a1628]/50 rounded-lg border border-teal-500/20 hover:border-teal-500/40 transition-all"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-white font-semibold">{{ task.title }}</h3>
                      @if (isUrgent(task)) {
                        <span
                          class="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded"
                        >
                          Urgente
                        </span>
                      }
                    </div>
                    <p class="text-gray-400 text-sm mb-2">{{ task.course }}</p>
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                      <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span>{{ task.time }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM7.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75V12zM8 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H8zM9.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V10zM10 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H10zM9.25 14a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V14zM12 9.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75H12zM11.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75V12zM12 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H12zM13.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H14a.75.75 0 01-.75-.75V10zM14 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H14z"
                          />
                          <path
                            fill-rule="evenodd"
                            d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span>{{ formatDate(task.date) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-center flex-shrink-0">
                    <div class="text-xs font-semibold text-gray-500 uppercase">
                      {{ task.month }}
                    </div>
                    <div class="text-3xl font-bold text-white">{{ task.day }}</div>
                    <div class="text-xs text-teal-400 font-medium mt-1">{{ task.daysUntil }}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AllTasksModalComponent {
  @Input() tasks: UpcomingEvent[] = [];
  @Output() close = new EventEmitter<void>();

  activeFilter: FilterType = 'all';

  filters = [
    { label: 'Todas', value: 'all' as FilterType },
    { label: 'Urgentes', value: 'urgent' as FilterType },
    { label: 'Esta Semana', value: 'thisWeek' as FilterType },
  ];

  get filteredTasks(): UpcomingEvent[] {
    if (this.activeFilter === 'all') {
      return this.tasks;
    }

    if (this.activeFilter === 'urgent') {
      return this.tasks.filter((t) => this.isUrgent(t));
    }

    if (this.activeFilter === 'thisWeek') {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return this.tasks.filter((t) => {
        const taskDate = new Date(t.date);
        return taskDate >= now && taskDate <= weekFromNow;
      });
    }

    return this.tasks;
  }

  isUrgent(task: UpcomingEvent): boolean {
    const now = new Date();
    const taskDate = new Date(task.date);
    const daysUntil = Math.ceil((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 2;
  }

  formatDate(date: Date): string {
    const taskDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return taskDate.toLocaleDateString('es-ES', options);
  }
}
