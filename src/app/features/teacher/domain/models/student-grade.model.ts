export interface StudentGrade {
    estudianteId: string;
    nombreCompleto: string;
    codigo: string;
    email: string;
    cursoId: string;
    evaluaciones: EvaluationGrade[];
    promedioFinal: number;
    asistencia: number;
    estado: 'Aprobado' | 'Reprobado' | 'En Proceso';
    comentarios?: string;
}

export interface EvaluationGrade {
    evaluacionId: string;
    titulo: string;
    tipo: 'Examen' | 'Tarea' | 'Proyecto' | 'Practica' | 'Participacion';
    peso: number;
    calificacion?: number;
    fechaEntrega?: Date;
    fechaLimite: Date;
    estado: 'Pendiente' | 'Entregado' | 'Calificado' | 'Retrasado';
    archivoUrl?: string;
}

export interface GradeInput {
    estudianteId: string;
    evaluacionId: string;
    calificacion: number;
    comentario?: string;
}

export interface BulkGradeInput {
    evaluacionId: string;
    calificaciones: Array<{
        estudianteId: string;
        calificacion: number;
        comentario?: string;
    }>;
}
