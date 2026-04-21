export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  department: string;
  status: 'ACTIVE' | 'SUSPENDED';
  nombresPersona?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}

export interface UserSummary {
  fullName: string;
  email: string;
  role: string;
  department: string;
  password: string;
  isGeneratedPassword: boolean;
}
