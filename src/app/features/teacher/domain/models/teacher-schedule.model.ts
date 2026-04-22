export interface HorarioSesion {
  id: string;
  cursoId: string;
  cursoNombre: string;
  cursoCodigo: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  tipo: string;
  modalidad: string;
}

export interface TeacherScheduleData {
  docenteId: string;
  docenteNombre: string;
  sesiones: HorarioSesion[];
}
