export const environment = {
  production: false,
  useMockData: false,
  // API Gateway Base URL
  gatewayUrl: 'http://localhost:5100',
  
  // Microservicios via Gateway
  usuariosApiUrl: 'http://localhost:5100/usuarios/api',
  estudiantesApiUrl: 'http://localhost:5100/estudiantes/api',
  cursosApiUrl: 'http://localhost:5100/cursos/api',
  evaluacionesApiUrl: 'http://localhost:5100/evaluaciones/api',
  noticiasEventosApiUrl: 'http://localhost:5100/noticias/api',
  docentesApiUrl: 'http://localhost:5100/docentes/api',
  carrerasApiUrl: 'http://localhost:5100/carreras/api',
  apiUrl: 'http://localhost:5100/usuarios/api', // Legacy or default
};
