export interface Assignment {
    id: string;
    cursoId: string;
    titulo: string;
    descripcion: string;
    tipo: 'Tarea' | 'Proyecto' | 'Trabajo Grupal' | 'Lectura' | 'Investigacion';
    fechaCreacion: Date;
    fechaLimite: Date;
    peso: number;
    puntajeMaximo: number;
    archivosAdjuntos: string[];
    instrucciones: string;
    rubrica?: string;
    entregasRecibidas: number;
    entregasPendientes: number;
    entregas: AssignmentSubmission[];
}

export interface AssignmentSubmission {
    id: string;
    assignmentId: string;
    estudianteId: string;
    nombreEstudiante: string;
    fechaEntrega: Date;
    archivoUrl?: string;
    comentarioEstudiante?: string;
    calificacion?: number;
    comentarioDocente?: string;
    estado: 'Pendiente' | 'Entregado' | 'Calificado' | 'Retrasado';
    intentos: number;
}

export interface AssignmentInput {
    cursoId: string;
    titulo: string;
    descripcion: string;
    tipo: 'Tarea' | 'Proyecto' | 'Trabajo Grupal' | 'Lectura' | 'Investigacion';
    fechaLimite: Date;
    peso: number;
    puntajeMaximo: number;
    instrucciones: string;
    archivosAdjuntos?: string[];
    rubrica?: string;
}
