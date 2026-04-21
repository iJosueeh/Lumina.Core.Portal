export interface EvaluacionGrades {
  id: string;
  nombre: string;
  peso: number;
  tipo: string;
}

export interface CalificacionEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  estudianteCodigo: string;
  notas: { [key: string]: number | null };
  promedio: number;
  estado: string;
}

export interface OpcionForm {
  id?: string;
  texto: string;
  esCorrecta: boolean;
  orden: number;
}

export interface PreguntaForm {
  id?: string;
  tipoPregunta: number; // 1=OpcionMultiple, 2=VerdaderoFalso, 3=RespuestaCorta, 4=Emparejamiento
  texto: string;
  puntos: number;
  orden: number;
  respuestaCorrecta?: string;
  explicacion?: string;
  imagenUrl?: string;
  opciones: OpcionForm[];
  esExistente?: boolean;
}

export interface CourseGradesData {
  courseId: string;
  courseName: string;
  courseCode: string;
  evaluaciones: EvaluacionGrades[];
  calificaciones: CalificacionEstudiante[];
  estadisticas: {
    promedioGeneral: number;
    notaMasAlta: number;
    notaMasBaja: number;
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    totalEstudiantes: number;
  };
}

export interface TeacherCourseGrades {
  id: string;
  codigo: string;
  titulo: string;
}
