import { User } from '../../features/auth/domain/models/user.model';
import { CourseGrade, GradeStats } from '../../features/student/domain/models/grade.model';
import {
  StudentProfile,
  SocialLinks,
  AccountSettings,
} from '../../features/student/domain/models/student-profile.model';

/**
 * Mock Data para Portal Estudiantil - Lumina.Core.Portal
 *
 * Este archivo contiene datos estáticos para probar la navegación
 * del portal sin necesidad de conectar a los microservicios.
 */

// ============================================
// USUARIO ESTUDIANTE
// ============================================

export const MOCK_STUDENT_USER: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'maria.rodriguez@lumina.edu.pe',
  fullName: 'María Fernanda Rodríguez García',
  role: 'STUDENT',
  token: 'mock-jwt-token-for-development-only',
};

// ============================================
// USUARIO DOCENTE
// ============================================

export const MOCK_TEACHER_USER: User = {
  id: '660f9511-f3ac-52e5-b827-557766551111',
  email: 'carlos.mendoza@lumina.edu.pe',
  fullName: 'Carlos Alberto Mendoza Silva',
  role: 'TEACHER',
  token: 'mock-jwt-token-teacher-development-only',
};

// ============================================
// CURSOS MATRICULADOS CON CALIFICACIONES
// ============================================

export const MOCK_STUDENT_GRADES: CourseGrade[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    nombre: 'Desarrollo Web Full Stack',
    codigo: 'DW-2024-01',
    profesor: 'Prof. Carlos Mendoza',
    creditos: 4,
    avance: 75,
    promedio: 17.5,
    estado: 'En Curso',
    evaluaciones: [
      {
        actividad: 'Examen Parcial - HTML & CSS',
        peso: 20,
        nota: 18,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto: Landing Page Responsiva',
        peso: 25,
        nota: 19,
        estado: 'Completado',
      },
      {
        actividad: 'Laboratorio: JavaScript ES6+',
        peso: 15,
        nota: 16,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto Final: Aplicación CRUD',
        peso: 40,
        nota: 0,
        estado: 'Pendiente',
      },
    ],
    promedioClase: 15.8,
    posicionamiento: 3,
    totalEstudiantes: 45,
    isExpanded: false,
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    nombre: 'Base de Datos Relacionales',
    codigo: 'BD-2024-01',
    profesor: 'Prof. Ana Martínez',
    creditos: 4,
    avance: 90,
    promedio: 16.2,
    estado: 'En Curso',
    evaluaciones: [
      {
        actividad: 'Examen: Modelo Entidad-Relación',
        peso: 20,
        nota: 17,
        estado: 'Completado',
      },
      {
        actividad: 'Práctica: Normalización de BD',
        peso: 15,
        nota: 15,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto: Diseño de Base de Datos',
        peso: 30,
        nota: 18,
        estado: 'Completado',
      },
      {
        actividad: 'Laboratorio: SQL Avanzado',
        peso: 20,
        nota: 14,
        estado: 'Completado',
      },
      {
        actividad: 'Examen Final',
        peso: 15,
        nota: 0,
        estado: 'Pendiente',
      },
    ],
    promedioClase: 14.5,
    posicionamiento: 8,
    totalEstudiantes: 42,
    isExpanded: false,
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    nombre: 'Programación Orientada a Objetos',
    codigo: 'POO-2024-01',
    profesor: 'Prof. Roberto Sánchez',
    creditos: 5,
    avance: 100,
    promedio: 18.0,
    estado: 'Aprobado',
    evaluaciones: [
      {
        actividad: 'Examen: Conceptos de POO',
        peso: 20,
        nota: 19,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto: Sistema de Biblioteca',
        peso: 30,
        nota: 18,
        estado: 'Completado',
      },
      {
        actividad: 'Laboratorio: Herencia y Polimorfismo',
        peso: 15,
        nota: 17,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto Final: Aplicación Empresarial',
        peso: 35,
        nota: 18,
        estado: 'Completado',
      },
    ],
    promedioClase: 16.2,
    posicionamiento: 2,
    totalEstudiantes: 38,
    isExpanded: false,
  },
  {
    id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    nombre: 'Arquitectura de Software',
    codigo: 'AS-2024-01',
    profesor: 'Prof. Laura Vega',
    creditos: 4,
    avance: 60,
    promedio: 15.8,
    estado: 'En Curso',
    evaluaciones: [
      {
        actividad: 'Examen: Patrones de Diseño',
        peso: 25,
        nota: 16,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto: Microservicios',
        peso: 35,
        nota: 17,
        estado: 'Completado',
      },
      {
        actividad: 'Presentación: Clean Architecture',
        peso: 20,
        nota: 14,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto Final: Sistema Distribuido',
        peso: 20,
        nota: 0,
        estado: 'Pendiente',
      },
    ],
    promedioClase: 15.0,
    posicionamiento: 12,
    totalEstudiantes: 35,
    isExpanded: false,
  },
  {
    id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    nombre: 'Algoritmos y Estructuras de Datos',
    codigo: 'AED-2024-01',
    profesor: 'Prof. Diego Torres',
    creditos: 5,
    avance: 45,
    promedio: 14.5,
    estado: 'En Riesgo',
    evaluaciones: [
      {
        actividad: 'Examen: Complejidad Algorítmica',
        peso: 20,
        nota: 13,
        estado: 'Completado',
      },
      {
        actividad: 'Laboratorio: Árboles y Grafos',
        peso: 25,
        nota: 15,
        estado: 'Completado',
      },
      {
        actividad: 'Proyecto: Algoritmos de Ordenamiento',
        peso: 20,
        nota: 16,
        estado: 'Completado',
      },
      {
        actividad: 'Examen Parcial',
        peso: 15,
        nota: 0,
        estado: 'Pendiente',
      },
      {
        actividad: 'Proyecto Final: Optimización',
        peso: 20,
        nota: 0,
        estado: 'Pendiente',
      },
    ],
    promedioClase: 14.8,
    posicionamiento: 25,
    totalEstudiantes: 40,
    isExpanded: false,
  },
];

// ============================================
// ESTADÍSTICAS GENERALES DEL ESTUDIANTE
// ============================================

export const MOCK_STUDENT_STATS: GradeStats = {
  promedioGeneral: 16.4,
  creditosAprobados: 145,
  totalCreditos: 200,
  cursosCompletados: 32,
  rankingClase: 'Top 12%',
  percentilRanking: 12,
  ultimaActualizacion: new Date('2024-01-12T16:00:00'),
};

// ============================================
// PERFIL COMPLETO DEL ESTUDIANTE
// ============================================

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  // Información básica
  id: '550e8400-e29b-41d4-a716-446655440000',
  codigo: 'EST-2021-001234',
  nombres: 'María Fernanda',
  apellidoPaterno: 'Rodríguez',
  apellidoMaterno: 'García',
  email: 'maria.rodriguez@lumina.edu.pe',
  telefono: '+51 987 654 321',
  fechaNacimiento: '2000-05-15',
  dni: '72345678',

  // Foto y biografía
  fotoUrl: 'https://ui-avatars.com/api/?name=Maria+Rodriguez&background=3b82f6&color=fff&size=256',
  biografia:
    'Estudiante apasionada por el desarrollo de software y la tecnología. Me especializo en desarrollo web full stack y arquitectura de software. Siempre buscando aprender nuevas tecnologías y mejorar mis habilidades.',

  // Información académica
  carrera: {
    id: 'carr-001',
    nombre: 'Ingeniería de Software',
    facultad: 'Facultad de Ingeniería',
  },
  ciclo: 7,
  modalidad: 'Presencial',
  turno: 'Mañana',
  sede: 'Lima - Campus Principal',
  fechaIngreso: '2021-03-15',
  fechaEgresoPrevista: '2026-12-20',

  // Dirección
  direccion: {
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Miraflores',
    calle: 'Av. Larco 1234, Piso 5, Dpto. 502',
    referencia: 'Frente al parque Kennedy, edificio azul',
  },

  // Contacto de emergencia
  contactoEmergencia: {
    nombre: 'Juan Carlos Rodríguez Pérez',
    relacion: 'Padre',
    telefono: '+51 987 123 456',
  },

  // Redes sociales
  redesSociales: {
    linkedin: 'https://linkedin.com/in/maria-rodriguez-dev',
    github: 'https://github.com/mariarodriguez',
    instagram: 'https://instagram.com/maria.codes',
    twitter: 'https://twitter.com/maria_dev',
    portfolio: 'https://mariarodriguez.dev',
    medium: 'https://medium.com/@maria.rodriguez',
  },

  // Estadísticas
  promedioGeneral: 16.4,
  creditosAprobados: 145,
  totalCreditos: 200,
};

// ============================================
// CONFIGURACIÓN DE CUENTA
// ============================================

export const MOCK_ACCOUNT_SETTINGS: AccountSettings = {
  notificaciones: {
    email: true,
    push: true,
    sms: false,
  },
  privacidad: {
    perfilPublico: true,
    mostrarEmail: false,
    mostrarTelefono: false,
    mostrarRedesSociales: true,
  },
  preferencias: {
    idioma: 'es',
    tema: 'auto',
    zonaHoraria: 'America/Lima',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene el usuario estudiante mock
 */
export function getMockStudentUser(): User {
  return { ...MOCK_STUDENT_USER };
}

/**
 * Obtiene el usuario docente mock
 */
export function getMockTeacherUser(): User {
  return { ...MOCK_TEACHER_USER };
}

/**
 * Obtiene las calificaciones del estudiante mock
 */
export function getMockStudentGrades(): CourseGrade[] {
  return MOCK_STUDENT_GRADES.map((grade) => ({ ...grade }));
}

/**
 * Obtiene las estadísticas del estudiante mock
 */
export function getMockStudentStats(): GradeStats {
  return { ...MOCK_STUDENT_STATS };
}

/**
 * Obtiene el perfil completo del estudiante mock
 */
export function getMockStudentProfile(): StudentProfile {
  return { ...MOCK_STUDENT_PROFILE };
}

/**
 * Obtiene la configuración de cuenta mock
 */
export function getMockAccountSettings(): AccountSettings {
  return { ...MOCK_ACCOUNT_SETTINGS };
}

/**
 * Simula un login exitoso y retorna el usuario mock
 * Soporta login de estudiante y docente
 */
export function mockLogin(email: string, password: string): User | null {
  // Validar que se proporcionen credenciales
  if (!email || !password) {
    return null;
  }

  // Login como docente
  if (
    email.toLowerCase().includes('carlos.mendoza') ||
    email.toLowerCase().includes('profesor') ||
    email.toLowerCase().includes('teacher')
  ) {
    return getMockTeacherUser();
  }

  // Login como estudiante (por defecto)
  return getMockStudentUser();
}
