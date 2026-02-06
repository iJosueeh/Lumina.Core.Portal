export const environment = {
  production: false,
  useMockData: false, // ← Conectado con Back-End real
  // Microservicios Backend
  apiUrl: 'http://localhost:7777/api', // Usuarios
  estudiantesApiUrl: 'http://localhost:6600/api', // Estudiantes
  cursosApiUrl: 'http://localhost:9999/api', // Cursos (HTTP)
  evaluacionesApiUrl: 'http://localhost:5555/api', // Evaluaciones
  noticiasEventosApiUrl: 'http://localhost:4444/api', // NoticiasEventos
  docentesApiUrl: 'http://localhost:8888/api', // Docentes
  carrerasApiUrl: 'http://localhost:5000/api', // Carreras
  pedidosApiUrl: 'http://localhost:5008/api', // Pedidos
};
