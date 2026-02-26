export interface EstudianteMetricas {
  estudianteId: string;
  promedioGeneral: number;
  totalEvaluaciones: number;
  evaluacionesCompletadas: number;
  notaMasAlta?: number;
  notaMasBaja?: number;
}

export interface EstudianteMetricasCompletas extends EstudianteMetricas {
  // Futuras métricas de otros servicios
  asistencia?: number;
  tareasEntregadas?: number;
  tareasPendientes?: number;
}
