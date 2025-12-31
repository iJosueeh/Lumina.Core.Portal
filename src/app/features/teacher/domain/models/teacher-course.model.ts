export interface TeacherCourse {
    id: string;
    codigo: string;
    titulo: string;
    descripcion?: string;
    creditos: number;
    ciclo: string;
    totalAlumnos: number;
    alumnosActivos: number;
    promedioGeneral: number;
    asistenciaPromedio: number;
    estadoCurso: 'Activo' | 'Finalizado' | 'Programado';
    horario: CourseSchedule[];
    silabo?: string;
}

export interface CourseSchedule {
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    aula: string;
    modalidad: 'Presencial' | 'Virtual' | 'Hibrido';
    enlaceReunion?: string;
}

export interface CourseStats {
    totalAlumnos: number;
    alumnosActivos: number;
    alumnosInactivos: number;
    promedioGeneral: number;
    aprobados: number;
    reprobados: number;
    asistenciaPromedio: number;
    tareasEntregadas: number;
    tareasPendientes: number;
}
