export interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  // Campos opcionales para la UI
  bio?: string;
  phone?: string;
  department?: string;
  stats?: {
    cursosAsignados: number;
    alumnosTotales: number;
    promedioGeneral: number;
    evaluacionesPendientes: number;
  };
}
