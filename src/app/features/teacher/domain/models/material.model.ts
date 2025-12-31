export interface Material {
    id: string;
    cursoId: string;
    titulo: string;
    descripcion: string;
    tipo: 'PDF' | 'Video' | 'Presentacion' | 'Documento' | 'Enlace' | 'Imagen' | 'Otro';
    url: string;
    tamaño?: number;
    fechaSubida: Date;
    semana?: number;
    unidad?: string;
    descargas: number;
    visible: boolean;
}

export interface MaterialInput {
    cursoId: string;
    titulo: string;
    descripcion: string;
    tipo: 'PDF' | 'Video' | 'Presentacion' | 'Documento' | 'Enlace' | 'Imagen' | 'Otro';
    url: string;
    semana?: number;
    unidad?: string;
    visible: boolean;
}
