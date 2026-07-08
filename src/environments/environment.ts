export const environment = {
  production: false,
  useMockData: false,
  
  // URLs directas a microservicios (desarrollo local)
  usuariosApiUrl: 'http://localhost:7777/api',
  estudiantesApiUrl: 'http://localhost:6601/api',
  cursosApiUrl: 'http://localhost:9999/api',
  evaluacionesApiUrl: 'http://localhost:5555/api',
  noticiasEventosApiUrl: 'http://localhost:4444/api',
  docentesApiUrl: 'http://localhost:8888/api',
  carrerasApiUrl: 'http://localhost:5001/api',
  
  // Default API (para auth)
  apiUrl: 'http://localhost:7777/api',
  
  // Gateway (para producción)
  gatewayUrl: 'http://localhost:5100',
};
