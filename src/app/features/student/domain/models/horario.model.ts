export interface Horario {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  ubicacion: string; // Mapeado desde "Aula" en el backend
  modalidad: 'Presencial' | 'Virtual' | 'Híbrido';
  tipoSesion: string; // Mapeado desde "Tipo" en el backend
  enlaceVirtual?: string; // Mapeado desde "EnlaceReunion" en el backend
}

export interface CursoConHorarios {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  duracion: string;
  nivel: string;
  precio: number;
  imagen: string;
  instructor: {
    nombre: string;
    cargo: string;
    bio: string;
    avatar: string;
    linkedIn?: string;
  };
  modulos: any[];
  requisitos: string[];
  testimonios: any[];
  horarios: Horario[];
}
