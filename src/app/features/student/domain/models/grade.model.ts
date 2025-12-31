export interface GradeStats {
    promedioGeneral: number;
    creditosAprobados: number;
    totalCreditos: number;
    cursosCompletados: number;
    rankingClase: string;
    percentilRanking: number;
    ultimaActualizacion: Date;
}

export interface Evaluation {
    actividad: string;
    peso: number;
    nota: number;
    estado: 'Completado' | 'Pendiente';
}

export interface CourseGrade {
    id: string;
    nombre: string;
    codigo: string;
    profesor: string;
    creditos: number;
    avance: number;
    promedio: number;
    estado: 'Aprobado' | 'En Curso' | 'En Riesgo';
    evaluaciones: Evaluation[];
    promedioClase: number;
    posicionamiento: number;
    totalEstudiantes: number;
    isExpanded?: boolean;
}
