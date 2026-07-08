export const environment = {
    production: true,
    useMockData: false,
    
    // URLs directas a microservicios (producción)
    // En producción, usar un reverse proxy como NGINX frente a los servicios
    usuariosApiUrl: 'https://usuarios.lumina.edu/api',
    estudiantesApiUrl: 'https://estudiantes.lumina.edu/api',
    cursosApiUrl: 'https://cursos.lumina.edu/api',
    evaluacionesApiUrl: 'https://evaluaciones.lumina.edu/api',
    noticiasEventosApiUrl: 'https://noticias.lumina.edu/api',
    docentesApiUrl: 'https://docentes.lumina.edu/api',
    carrerasApiUrl: 'https://carreras.lumina.edu/api',
    pedidosApiUrl: 'https://pedidos.lumina.edu/api',
    
    // Default API (para auth)
    apiUrl: 'https://usuarios.lumina.edu/api',
};
