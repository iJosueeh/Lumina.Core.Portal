export interface AdminCourse {
  id?: string;
  name: string;
  code: string;
  teacherName?: string;
  instructorId: string | null;
  capacity: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  description: string;
  ciclo: string;
  creditos: number;
  coverImage: string;
  modules: AdminModule[];
  evaluaciones: AdminEvaluation[];
}

export interface AdminModule {
  id?: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  lecciones?: string[];
}

export interface AdminEvaluation {
  id?: string;
  nombre: string;
  tipo: string;
  peso: number;
  fechaLimite: string;
  preguntas?: any[];
}

export interface AdminDocente {
  id: string;
  nombreCompleto: string;
  email: string;
}
