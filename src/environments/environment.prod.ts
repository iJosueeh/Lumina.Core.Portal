export const environment = {
    production: true,
    useMockData: false,

    // URLs directas a microservicios en Render (dominios *.lumina.edu aún no configurados)
    usuariosApiUrl: 'https://lumina-usuarios.onrender.com/api',
    estudiantesApiUrl: 'https://lumina-estudiantes.onrender.com/api',
    cursosApiUrl: 'https://lumina-cursos.onrender.com/api',
    evaluacionesApiUrl: 'https://lumina-evaluaciones.onrender.com/api',
    noticiasEventosApiUrl: 'https://lumina-noticiaseventos.onrender.com/api',
    docentesApiUrl: 'https://lumina-docentes.onrender.com/api',
    carrerasApiUrl: 'https://lumina-carreras.onrender.com/api',
    pedidosApiUrl: 'https://lumina-pedidos.onrender.com/api',

    // System Settings (integrated into Usuarios microservice)
    systemSettingsApiUrl: 'https://lumina-usuarios.onrender.com/api/system-settings',

    // Default API (para auth)
    apiUrl: 'https://lumina-usuarios.onrender.com/api',
};
