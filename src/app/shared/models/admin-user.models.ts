export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  department: string;
  status: 'ACTIVE' | 'SUSPENDED';
  nombresPersona?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  fechaNacimiento?: string;
  pais?: string;
  provincia?: string;
  distrito?: string;
  calle?: string;
}

export interface UserSummary {
  fullName: string;
  email: string;
  role: string;
  department: string;
  password: string;
  isGeneratedPassword: boolean;
}
