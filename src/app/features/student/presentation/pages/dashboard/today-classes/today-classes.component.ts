import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoConHorarios } from '@features/student/domain/models/horario.model';

@Component({
  selector: 'app-today-classes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './today-classes.component.html',
  styleUrl: './today-classes.component.css'
})
export class TodayClassesComponent {
  @Input() courses: CursoConHorarios[] = [];
  @Input() isLoading = false;

  todayName = computed(() => {
    const dayIndex = new Date().getDay();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayIndex];
  });

  todayClasses = computed(() => {
    const today = this.todayName();
    const classes: { course: string; time: string; room: string; modalidad: string }[] = [];

    this.courses.forEach(course => {
      if (course.horarios) {
        course.horarios.forEach(h => {
          if (h.diaSemana === today) {
            classes.push({
              course: course.titulo,
              time: `${h.horaInicio} - ${h.horaFin}`,
              room: h.ubicacion,
              modalidad: h.modalidad
            });
          }
        });
      }
    });

    return classes.sort((a, b) => a.time.localeCompare(b.time));
  });
}
