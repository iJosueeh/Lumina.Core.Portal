import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ScheduleRepository } from '../../domain/repositories/schedule.repository';
import { CalendarEvent, UpcomingEvent } from '../../domain/models/calendar-event.model';
import { environment } from '../../../../../environments/environment';

interface ProgramacionCalendarioResponse {
    id: string;
    titulo: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    cursoId: string;
    cursoNombre: string;
    tipo: string;
    enlaceReunion: string;
    docenteId: string;
    docenteNombre: string;
    modalidad: string;
    diaSemana: number;
}

@Injectable({
    providedIn: 'root'
})
export class ScheduleHttpRepositoryImpl extends ScheduleRepository {
    private readonly estudiantesApiUrl = environment.estudiantesApiUrl;
    private readonly evaluacionesApiUrl = environment.evaluacionesApiUrl;

    constructor(private http: HttpClient) {
        super();
    }

    override getScheduleByStudent(studentId: string): Observable<CalendarEvent[]> {
        return this.http.get<ProgramacionCalendarioResponse[]>(
            `${this.estudiantesApiUrl}/programaciones?estudianteId=${studentId}`
        ).pipe(
            map(programaciones => {
                return programaciones.map(prog => {
                    const fechaInicio = new Date(prog.fechaInicio);
                    const fechaFin = new Date(prog.fechaFin);
                    
                    return {
                        id: prog.id,
                        title: prog.cursoNombre,
                        type: this.mapTipoEvento(prog.tipo),
                        startTime: this.formatTime(fechaInicio),
                        endTime: this.formatTime(fechaFin),
                        location: prog.modalidad === 'Virtual' ? prog.enlaceReunion : 'Presencial',
                        locationType: prog.modalidad === 'Virtual' ? 'virtual' : 'presencial',
                        color: this.getColorByType(prog.tipo),
                        dayOfWeek: this.convertDiaSemana(prog.diaSemana),
                        date: fechaInicio,
                        isUrgent: prog.tipo === 'EXAMEN'
                    } as CalendarEvent;
                });
            })
        );
    }

    override getUpcomingEvents(studentId: string): Observable<UpcomingEvent[]> {
        // Obtener evaluaciones próximas
        return this.http.get<any>(
            `${this.evaluacionesApiUrl}/Evaluaciones?estudianteId=${studentId}`
        ).pipe(
            map(response => {
                console.log('🔍 [SCHEDULE] RAW Response del backend:', response);
                console.log('🔍 [SCHEDULE] Tipo de response:', typeof response);
                console.log('🔍 [SCHEDULE] Es array?:', Array.isArray(response));
                console.log('🔍 [SCHEDULE] Keys:', response ? Object.keys(response) : 'N/A');
                
                // Extraer el array de evaluaciones
                let evaluaciones: any[];
                
                if (Array.isArray(response)) {
                    evaluaciones = response;
                } else if (response && Array.isArray(response.data)) {
                    evaluaciones = response.data;
                } else if (response && Array.isArray(response.evaluaciones)) {
                    evaluaciones = response.evaluaciones;
                } else if (response && Array.isArray(response.items)) {
                    evaluaciones = response.items;
                } else {
                    console.error('❌ [SCHEDULE] No se pudo encontrar el array de evaluaciones en:', response);
                    evaluaciones = [];
                }
                
                console.log('✅ [SCHEDULE] Evaluaciones extraídas:', evaluaciones.length, 'items');
                
                const now = new Date();
                const upcoming = evaluaciones
                    .filter(ev => new Date(ev.fechaFin) > now)
                    .sort((a, b) => new Date(a.fechaFin).getTime() - new Date(b.fechaFin).getTime())
                    .slice(0, 3);

                return upcoming.map(ev => {
                    const fecha = new Date(ev.fechaFin);
                    const daysUntil = this.calculateDaysUntil(fecha);
                    
                    return {
                        id: ev.id,
                        title: ev.titulo,
                        course: ev.cursoNombre,
                        date: fecha,
                        time: this.formatTime(fecha),
                        month: this.getMonthAbbr(fecha),
                        day: fecha.getDate(),
                        daysUntil: daysUntil
                    } as UpcomingEvent;
                });
            })
        );
    }

    private mapTipoEvento(tipo: string): 'class' | 'exam' | 'workshop' | 'meeting' {
        const mapping: { [key: string]: 'class' | 'exam' | 'workshop' | 'meeting' } = {
            'CLASE_REGULAR': 'class',
            'EXAMEN': 'exam',
            'TALLER': 'workshop',
            'REUNION': 'meeting'
        };
        return mapping[tipo] || 'class';
    }

    private getColorByType(tipo: string): string {
        const colors: { [key: string]: string } = {
            'CLASE_REGULAR': 'bg-blue-500',
            'EXAMEN': 'bg-red-500',
            'TALLER': 'bg-orange-500',
            'REUNION': 'bg-green-500'
        };
        return colors[tipo] || 'bg-gray-500';
    }

    private formatTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    private convertDiaSemana(diaSemana: number): number {
        // Backend: 1=Mon, 2=Tue, ... 7=Sun
        // Frontend: 0=Mon, 1=Tue, ... 6=Sun
        return diaSemana === 7 ? 6 : diaSemana - 1;
    }

    private calculateDaysUntil(fecha: Date): string {
        const now = new Date();
        const diff = fecha.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Mañana';
        if (days < 7) return `En ${days} días`;
        return '';
    }

    private getMonthAbbr(date: Date): string {
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 
                       'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        return months[date.getMonth()];
    }
}
