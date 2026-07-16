import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { HorarioSesion, TeacherScheduleData } from '../../../domain/models/teacher-schedule.model';
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './teacher-schedule.component.html',
})
export class TeacherScheduleComponent implements OnInit {
  scheduleData = signal<TeacherScheduleData | null>(null);
  isLoading = signal(true);

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  horasDelDia = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  sesiones = computed(() => this.scheduleData()?.sesiones || []);

  sesionesPorDia = computed(() => {
    const sesiones = this.sesiones();
    const agrupadas: Record<string, HorarioSesion[]> = {};
    this.diasSemana.forEach(dia => {
      agrupadas[dia] = sesiones.filter((s: HorarioSesion) => s.dia === dia);
    });
    return agrupadas;
  });

  totalSesiones = computed(() => this.sesiones().length);
  totalHorasSemana = computed(() => {
    const sesiones = this.sesiones();
    return sesiones.reduce((total: number, sesion: HorarioSesion) => {
      const inicio = this.parseTime(sesion.horaInicio);
      const fin = this.parseTime(sesion.horaFin);
      return total + (fin - inicio);
    }, 0);
  });

  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);

  ngOnInit(): void {
    this.loadSchedule();
  }

  private async loadSchedule(): Promise<void> {
    this.isLoading.set(true);
    try {
      const user = this.authRepo.getCurrentUser();
      const userId = user?.id || '';

      const [teacherInfo, courses] = await Promise.all([
        this.teacherQuery.getTeacherInfo(userId),
        this.teacherQuery.getTeacherCourses(userId),
      ]);

      const slotMap: Array<[
        { dia: string; horaInicio: string; horaFin: string; tipo: string },
        { dia: string; horaInicio: string; horaFin: string; tipo: string }
      ]> = [
        [{ dia: 'Lunes',    horaInicio: '18:00', horaFin: '21:00', tipo: 'Teórica'  },
         { dia: 'Miércoles', horaInicio: '18:00', horaFin: '21:00', tipo: 'Práctica' }],
        [{ dia: 'Martes',   horaInicio: '19:00', horaFin: '22:00', tipo: 'Teórica'  },
         { dia: 'Jueves',   horaInicio: '19:00', horaFin: '22:00', tipo: 'Práctica' }],
        [{ dia: 'Viernes',  horaInicio: '16:00', horaFin: '19:00', tipo: 'Teórica'  },
         { dia: 'Sábado',   horaInicio: '09:00', horaFin: '12:00', tipo: 'Práctica' }],
        [{ dia: 'Lunes',    horaInicio: '14:00', horaFin: '17:00', tipo: 'Teórica'  },
         { dia: 'Jueves',   horaInicio: '14:00', horaFin: '17:00', tipo: 'Práctica' }],
      ];

      const aulasByModalidad: Record<string, string[]> = {
        Virtual:    ['Aula Virtual'],
        Presencial: ['Lab 301', 'Lab 205', 'Lab 102', 'Aula A201'],
        Híbrido:    ['Lab 301', 'Lab 205', 'Lab 102', 'Aula A201'],
      };

      const sesiones: HorarioSesion[] = [];
      courses.forEach((course, idx) => {
        const slots = slotMap[idx % slotMap.length];
        const modalidad = (course as any).modalidad || 'Presencial';
        const aulaList = aulasByModalidad[modalidad] ?? aulasByModalidad['Presencial'];

        slots.forEach((slot, slotIdx) => {
          sesiones.push({
            id: `ses-${course.id.slice(0, 8)}-${slotIdx}`,
            cursoId: course.id,
            cursoNombre: course.titulo,
            cursoCodigo: course.codigo,
            dia: slot.dia,
            horaInicio: slot.horaInicio,
            horaFin: slot.horaFin,
            aula: modalidad === 'Virtual' ? 'Aula Virtual' : aulaList[(idx + slotIdx) % aulaList.length],
            tipo: slot.tipo,
            modalidad,
          });
        });
      });

      this.scheduleData.set({
        docenteId: teacherInfo.id,
        docenteNombre: teacherInfo.nombre ?? '',
        sesiones,
      });
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }

  getSesionPosition(sesion: HorarioSesion): { top: string; height: string } {
    const inicio = this.parseTime(sesion.horaInicio);
    const fin = this.parseTime(sesion.horaFin);
    const top = ((inicio - 8) / 14) * 100;
    const height = ((fin - inicio) / 14) * 100;
    return { top: `${top}%`, height: `${height}%` };
  }

  getTipoColor(tipo: string): string {
    return tipo === 'Teórica'
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'bg-purple-50 border-purple-300 text-purple-700';
  }
}
