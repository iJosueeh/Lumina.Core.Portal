export interface StudentProfile {
  // Información básica
  id: string;
  codigo: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  dni: string;

  // Foto y biografía
  fotoUrl?: string;
  biografia?: string;

  // Información académica
  carrera: {
    id: string;
    nombre: string;
    facultad: string;
  };
  ciclo: number;
  modalidad: 'Presencial' | 'Virtual' | 'Híbrido';
  turno: 'Mañana' | 'Tarde' | 'Noche';
  sede: string;
  fechaIngreso: string;
  fechaEgresoPrevista: string;

  // Dirección
  direccion: {
    departamento: string;
    provincia: string;
    distrito: string;
    calle: string;
    referencia?: string;
  };

  // Contacto de emergencia
  contactoEmergencia: {
    nombre: string;
    relacion: string;
    telefono: string;
  };

  // Redes sociales
  redesSociales: SocialLinks;

  // Estadísticas
  promedioGeneral: number;
  creditosAprobados: number;
  totalCreditos: number;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  portfolio?: string;
  youtube?: string;
  medium?: string;
}

export interface AccountSettings {
  notificaciones: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacidad: {
    perfilPublico: boolean;
    mostrarEmail: boolean;
    mostrarTelefono: boolean;
    mostrarRedesSociales: boolean;
  };
  preferencias: {
    idioma: 'es' | 'en';
    tema: 'light' | 'dark' | 'auto';
    zonaHoraria: string;
  };
}
