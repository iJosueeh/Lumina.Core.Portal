import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CalendarEvent } from '@features/student/domain/models/calendar-event.model';

type EventCategory = 'class' | 'exam' | 'workshop' | 'meeting' | 'personal';

interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

@Component({
  selector: 'app-add-event-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-event-modal.component.html',
  styleUrl: './add-event-modal.component.css',
})
export class AddEventModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() eventAdded = new EventEmitter<CalendarEvent>();

  eventForm!: FormGroup;
  isSaving = signal(false);
  error = signal<string | null>(null);

  categories: Record<EventCategory, CategoryConfig> = {
    class: {
      label: 'Clase',
      color: 'bg-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    exam: {
      label: 'Examen',
      color: 'bg-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
    },
    workshop: {
      label: 'Taller/Lab',
      color: 'bg-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z',
    },
    meeting: {
      label: 'Reunión',
      color: 'bg-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    },
    personal: {
      label: 'Personal',
      color: 'bg-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    },
  };

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      category: ['class', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      location: ['', Validators.required],
      locationType: ['presencial', Validators.required],
      description: [''],
    });
  }

  selectCategory(category: EventCategory): void {
    this.eventForm.patchValue({ category });
  }

  async saveEvent(): Promise<void> {
    if (this.eventForm.invalid) {
      this.error.set('Por favor completa todos los campos requeridos');
      this.markFormGroupTouched(this.eventForm);
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const formValue = this.eventForm.value;
      const selectedDate = new Date(formValue.date);
      const dayOfWeek = selectedDate.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

      // Convertir domingo (0) a 6, y el resto restar 1 para que Lun=0
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const newEvent: Omit<CalendarEvent, 'id'> = {
        title: formValue.title,
        type: formValue.category,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        location: formValue.location,
        locationType: formValue.locationType,
        color: this.categories[formValue.category as EventCategory].color,
        dayOfWeek: adjustedDayOfWeek,
        date: selectedDate,
        isUrgent: formValue.category === 'exam',
      };

      // Guardar en localStorage directamente (simulando addMockEvent)
      const stored = localStorage.getItem('schedule_events');
      let events: CalendarEvent[] = [];

      if (stored) {
        try {
          events = JSON.parse(stored);
        } catch (error) {
          console.error('❌ Error parsing stored events:', error);
        }
      }

      // Generar ID único
      const eventToSave: CalendarEvent = {
        ...newEvent,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      } as CalendarEvent;

      events.push(eventToSave);
      localStorage.setItem('schedule_events', JSON.stringify(events));

      const savedEvent = eventToSave;

      // Emitir evento
      this.eventAdded.emit(savedEvent);

      // Cerrar modal
      this.closeModal();
    } catch (err) {
      this.error.set('Error al guardar el evento. Por favor intenta de nuevo.');
      console.error('Error saving event:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.eventForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.eventForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minLength'])
      return `Mínimo ${control.errors['minLength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }
}
