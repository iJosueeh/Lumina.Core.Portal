export interface Announcement {
    id: string;
    cursoId?: string;
    titulo: string;
    contenido: string;
    tipo: 'Informacion' | 'Urgente' | 'Evento' | 'Cambio' | 'Recordatorio';
    prioridad: 'Alta' | 'Media' | 'Baja';
    fechaPublicacion: Date;
    fechaExpiracion?: Date;
    adjuntos: string[];
    publicadoPor: string;
    visiblePara: 'Todos' | 'Curso Especifico';
    leido: boolean;
}

export interface AnnouncementInput {
    cursoId?: string;
    titulo: string;
    contenido: string;
    tipo: 'Informacion' | 'Urgente' | 'Evento' | 'Cambio' | 'Recordatorio';
    prioridad: 'Alta' | 'Media' | 'Baja';
    fechaExpiracion?: Date;
    adjuntos?: string[];
    visiblePara: 'Todos' | 'Curso Especifico';
}
