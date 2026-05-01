export interface EvaluacionApi {
  id: string;
  titulo: string;
  tipoEvaluacion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  totalPreguntas: number;
  puntajeMaximo: number;
}

export interface QuestionDraft {
  id?: string;
  esExistente?: boolean;
  texto: string;
  puntos: number;
  explicacion: string;
  opciones: { texto: string; esCorrecta: boolean }[];
}

export interface TeacherCourseDetail {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  creditos: number;
  ciclo: string;
  totalAlumnos: number;
  alumnosActivos: number;
  alumnosInactivos: number;
  promedioGeneral: number;
  asistenciaPromedio: number;
  estadoCurso: 'Activo' | 'Finalizado' | 'Programado';
  coverImage: string;
  horario: any[];
  nivel?: string;
  modalidad?: string;
  duracion?: string;
  categoria?: string;
  instructorNombre?: string;
  stats: {
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    tareasEntregadas: number;
    tareasPendientes: number;
    promedioMasAlto: number;
    promedioMasBajo: number;
  };
  evaluaciones: Evaluacion[];
}

export interface Evaluacion {
  id: string;
  nombre: string;
  tipo: string;
  peso: number;
  fechaLimite: string;
  estado: string;
  calificadas: number;
  pendientes: number;
  promedio: number;
}

export interface Modulo {
  id: string;
  orden: number;
  titulo: string;
  descripcion: string;
  duracion: string;
  lecciones: Leccion[];
  materiales: ModuloMaterial[];
  completado: boolean;
  porcentajeCompletado: number;
}

export interface ModuloMaterial {
  id: string;
  titulo: string;
  tipo: string;
  url: string;
}

export interface Leccion {
  id: string;
  titulo: string;
  tipo: 'video' | 'lectura' | 'quiz' | 'tarea';
  duracion: string;
  completada: boolean;
  videoUrl?: string;
  descripcion?: string;
}

export interface CourseStudent {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  email: string;
  avatar: string;
  promedio: number;
  asistencia: number;
  tareasEntregadas: number;
  tareasPendientes: number;
  estado: string;
  ultimoAcceso: string;
}

export interface AssignableUser {
  id: string;
  nombreCompleto: string;
  email: string;
  rolNombre: string;
}

export type TabType = 'overview' | 'modulos' | 'estudiantes' | 'evaluaciones' | 'description' | 'content';
export type NotificationType = 'success' | 'error' | 'info';
export type AssignMode = 'student' | 'usuario';

export interface ProgramacionItem {
  id: string;
  cursoId: string;
  docenteId?: string;
  estado?: string;
}
