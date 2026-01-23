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
  estado: 'Activo' | 'En Riesgo' | 'Inactivo' | 'Retirado';
  ultimoAcceso: string;
}

export interface CourseStudentsList {
  courseId: string;
  courseName: string;
  courseCode: string;
  students: CourseStudent[];
}
