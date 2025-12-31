export interface Announcement {
    id: string;
    titulo: string;
    descripcion: string;
    fechaPublicacion: Date;
    autor: string;
    tipo: 'SISTEMA' | 'CURSO' | 'GENERAL';
    icono: string;
    tiempoRelativo: string;
}
