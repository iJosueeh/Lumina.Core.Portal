import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';

interface HorarioSesion {
  id: string;
  cursoId: string;
  cursoNombre: string;
  cursoCodigo: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  tipo: string;
  modalidad: string;
}

interface TeacherScheduleData {
  docenteId: string;
  docenteNombre: string;
  sesiones: HorarioSesion[];
}

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-schedule.component.html',
  styles: ``,
})
export class TeacherScheduleComponent implements OnInit {
  scheduleData = signal<TeacherScheduleData | null>(null);
  isLoading = signal(true);
  selectedDay = signal<string>('');

  // Días de la semana
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Horas del día (8am - 10pm)
  horasDelDia = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  // Computed values
  sesiones = computed(() => this.scheduleData()?.sesiones || []);

  // Sesiones agrupadas por día
  sesionesPorDia = computed(() => {
    const sesiones = this.sesiones();
    const agrupadas: Record<string, HorarioSesion[]> = {};
    
    this.diasSemana.forEach(dia => {
      agrupadas[dia] = sesiones.filter(s => s.dia === dia);
    });
    
    return agrupadas;
  });

  // Estadísticas
  totalSesiones = computed(() => this.sesiones().length);
  totalHorasSemana = computed(() => {
    const sesiones = this.sesiones();
    return sesiones.reduce((total, sesion) => {
      const inicio = this.parseTime(sesion.horaInicio);
      const fin = this.parseTime(sesion.horaFin);
      return total + (fin - inicio);
    }, 0);
  });

  cursosUnicos = computed(() => {
    const sesiones = this.sesiones();
    const cursosSet = new Set(sesiones.map(s => s.cursoCodigo));
    return cursosSet.size;
  });

  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);

  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.loadSchedule();
  }

  async loadSchedule(): Promise<void> {
    this.isLoading.set(true);
    try {
      const user = this.authRepo.getCurrentUser();
      const userId = user?.id || (user as any)?.sub || '';

      const [teacherInfo, courses] = await Promise.all([
        this.teacherQuery.getTeacherInfo(userId),
        this.teacherQuery.getTeacherCourses(userId),
      ]);

      // Assign each course a deterministic pair of weekly slots
      const slotMap: Array<[
        { dia: string; horaInicio: string; horaFin: string; tipo: string },
        { dia: string; horaInicio: string; horaFin: string; tipo: string }
      ]> = [
        [
          { dia: 'Lunes',    horaInicio: '18:00', horaFin: '21:00', tipo: 'Teórica'  },
          { dia: 'Miércoles', horaInicio: '18:00', horaFin: '21:00', tipo: 'Práctica' },
        ],
        [
          { dia: 'Martes',   horaInicio: '19:00', horaFin: '22:00', tipo: 'Teórica'  },
          { dia: 'Jueves',   horaInicio: '19:00', horaFin: '22:00', tipo: 'Práctica' },
        ],
        [
          { dia: 'Viernes',  horaInicio: '16:00', horaFin: '19:00', tipo: 'Teórica'  },
          { dia: 'Sábado',   horaInicio: '09:00', horaFin: '12:00', tipo: 'Práctica' },
        ],
        [
          { dia: 'Lunes',    horaInicio: '14:00', horaFin: '17:00', tipo: 'Teórica'  },
          { dia: 'Jueves',   horaInicio: '14:00', horaFin: '17:00', tipo: 'Práctica' },
        ],
      ];

      const aulasByModalidad: Record<string, string[]> = {
        Virtual:    ['Aula Virtual'],
        Presencial: ['Lab 301', 'Lab 205', 'Lab 102', 'Aula A201'],
        Híbrido:    ['Lab 301', 'Lab 205', 'Lab 102', 'Aula A201'],
        Hibrido:    ['Lab 301', 'Lab 205', 'Lab 102', 'Aula A201'],
      };

      const sesiones: HorarioSesion[] = [];
      courses.forEach((course, idx) => {
        const slots = slotMap[idx % slotMap.length];
        const modalidad = (course as any).modalidad || 'Presencial';
        const aulaList = aulasByModalidad[modalidad] ?? aulasByModalidad['Presencial'];

        slots.forEach((slot, slotIdx) => {
          const aula = modalidad === 'Virtual'
            ? 'Aula Virtual'
            : aulaList[(idx + slotIdx) % aulaList.length];

          sesiones.push({
            id: `ses-${course.id.slice(0, 8)}-${slotIdx}`,
            cursoId: course.id,
            cursoNombre: course.titulo,
            cursoCodigo: course.codigo,
            dia: slot.dia,
            horaInicio: slot.horaInicio,
            horaFin: slot.horaFin,
            aula,
            tipo: slot.tipo,
            modalidad,
          });
        });
      });

      const scheduleData: TeacherScheduleData = {
        docenteId: teacherInfo.id,
        docenteNombre: teacherInfo.nombre ?? '',
        sesiones,
      };

      this.scheduleData.set(scheduleData);
      console.log(`✅ [SCHEDULE] Loaded ${sesiones.length} sesiones from ${courses.length} cursos`);
    } catch (err) {
      console.error('❌ [SCHEDULE] Error loading schedule:', err);
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
    const duracion = fin - inicio;
    
    // Calcular posición relativa (8am = 0%)
    const top = ((inicio - 8) / 14) * 100; // 14 horas de 8am a 10pm
    const height = (duracion / 14) * 100;
    
    return {
      top: `${top}%`,
      height: `${height}%`
    };
  }

  getTipoColor(tipo: string): string {
    return tipo === 'Teórica' 
      ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
      : 'bg-purple-500/20 border-purple-500 text-purple-400';
  }

  getModalidadIcon(modalidad: string): string {
    const icons: Record<string, string> = {
      'Presencial': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      'Virtual': 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      'Híbrido': 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
    };
    return icons[modalidad] || icons['Presencial'];
  }
}
