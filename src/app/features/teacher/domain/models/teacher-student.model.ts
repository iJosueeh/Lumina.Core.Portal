export interface TeacherStudent {
  id: string;
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  cursos: string[]; // IDs de cursos en los que está matriculado
}

export interface TeacherStudentDetailed {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  email: string;
  departamento: string;
  provincia: string;
  distrito: string;
  estado: string;
  cursosMatriculados: StudentCourse[];
}

export interface StudentCourse {
  cursoId: string;
  cursoNombre: string;
  programacionId: string;
  fechaMatricula: Date;
  estadoMatricula: number;
}
