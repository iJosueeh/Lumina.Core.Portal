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
    modulos?: CourseModulo[];
    silabo?: string;
    // Campos adicionales del API
    imagen?: string;
    nivel?: string;
    modalidad?: string;
    duracion?: string;
    categoria?: string;
    instructor?: { nombre: string; cargo: string; avatar?: string };
}

export interface CourseSchedule {
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    aula: string;
    modalidad: 'Presencial' | 'Virtual' | 'Hibrido';
    enlaceReunion?: string;
}

export interface CourseModulo {
    id: string;
    titulo: string;
    descripcion?: string;
    lecciones: string[];
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
