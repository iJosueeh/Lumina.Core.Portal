export interface CourseProgress {
    id: string;
    titulo: string;
    categoria: string;
    moduloActual: string;
    progreso: number;
    ultimoAcceso: Date;
    imagenUrl: string;
    colorCategoria: string;
}
