export interface TeacherEvaluation {
    id: string;
    cursoId: string;
    titulo: string;
    descripcion: string;
    tipo: 'Examen' | 'Practica' | 'Quiz' | 'Parcial' | 'Final';
    fechaInicio: Date;
    fechaFin: Date;
    duracionMinutos: number;
    peso: number;
    puntajeMaximo: number;
    intentosMaximos: number;
    preguntas: EvaluationQuestion[];
    configuracion: EvaluationConfig;
    estadisticas: EvaluationStats;
}

export interface EvaluationQuestion {
    id: string;
    orden: number;
    pregunta: string;
    tipo: 'Opcion Multiple' | 'Verdadero/Falso' | 'Respuesta Corta' | 'Desarrollo';
    opciones?: string[];
    respuestaCorrecta?: string;
    puntos: number;
}

export interface EvaluationConfig {
    mostrarResultadoInmediato: boolean;
    permitirRevision: boolean;
    ordenAleatorio: boolean;
    mostrarUnaVez: boolean;
    requiereWebcam: boolean;
}

export interface EvaluationStats {
    totalEstudiantes: number;
    estudiantesCompletados: number;
    estudiantesPendientes: number;
    promedioGeneral: number;
    notaMaxima: number;
    notaMinima: number;
    tiempoPromedioMinutos: number;
}

export interface EvaluationInput {
    cursoId: string;
    titulo: string;
    descripcion: string;
    tipo: 'Examen' | 'Practica' | 'Quiz' | 'Parcial' | 'Final';
    fechaInicio: Date;
    fechaFin: Date;
    duracionMinutos: number;
    peso: number;
    puntajeMaximo: number;
    intentosMaximos: number;
    preguntas: Omit<EvaluationQuestion, 'id'>[];
    configuracion: EvaluationConfig;
}
