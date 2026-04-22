export interface Asistencia {
  estudianteId: string;
  estado: 'Presente' | 'Ausente' | 'Tardanza';
  horaLlegada?: string;
  observacion?: string;
}

export interface Sesion {
  id: string;
  fecha: string;
  tema: string;
  tipo: string;
  duracion: string;
  asistencias: Asistencia[];
  porcentajeAsistencia: number;
}

export interface ResumenEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  totalSesiones: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  porcentajeAsistencia: number;
}

export interface AttendanceData {
  courseId: string;
  courseName: string;
  courseCode: string;
  sesiones: Sesion[];
  resumenEstudiantes: ResumenEstudiante[];
}

export interface AttendanceCourse {
  id: string;
  codigo: string;
  titulo: string;
}

// Aliases para compatibilidad con repositorio existente
export type Attendance = Asistencia;
export type AttendanceStats = any;
export type AttendanceInput = any;
export type StudentAttendanceSummary = ResumenEstudiante;
