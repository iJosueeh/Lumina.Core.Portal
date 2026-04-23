export const environment = {
  production: false,
  useMockData: false,
  // API Gateway Base URL
  gatewayUrl: 'http://localhost:5000',
  
  // Microservicios via Gateway
  usuariosApiUrl: 'http://localhost:5000/usuarios/api',
  estudiantesApiUrl: 'http://localhost:5000/estudiantes/api',
  cursosApiUrl: 'http://localhost:5000/cursos/api',
  evaluacionesApiUrl: 'http://localhost:5000/evaluaciones/api',
  noticiasEventosApiUrl: 'http://localhost:5000/noticias/api',
  docentesApiUrl: 'http://localhost:5000/docentes/api',
  carrerasApiUrl: 'http://localhost:5000/carreras/api',
  apiUrl: 'http://localhost:5000/usuarios/api', // Legacy or default
};
