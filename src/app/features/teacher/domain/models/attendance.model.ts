export interface Attendance {
    id: string;
    cursoId: string;
    fecha: Date;
    sesion: number;
    registros: AttendanceRecord[];
    tema: string;
    observaciones?: string;
}

export interface AttendanceRecord {
    estudianteId: string;
    nombreCompleto: string;
    codigo: string;
    estado: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
    horaLlegada?: string;
    observaciones?: string;
}

export interface AttendanceStats {
    totalSesiones: number;
    promedioAsistencia: number;
    estudiantesConBajaAsistencia: StudentAttendanceSummary[];
}

export interface StudentAttendanceSummary {
    estudianteId: string;
    nombreCompleto: string;
    codigo: string;
    totalPresencias: number;
    totalAusencias: number;
    totalTardanzas: number;
    porcentajeAsistencia: number;
}

export interface AttendanceInput {
    cursoId: string;
    fecha: Date;
    tema: string;
    registros: Array<{
        estudianteId: string;
        estado: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
        horaLlegada?: string;
        observaciones?: string;
    }>;
}
