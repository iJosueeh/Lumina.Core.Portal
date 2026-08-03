// Path: Lumina.Core.Portal/src/environments/environment.vercel.ts
/**
 * Environment configuration for Vercel deployment.
 * 
 * Uses relative URLs that will be proxied through Vercel rewrites
 * to the actual microservices backend.
 */
export const environment = {
  production: true,
  useMockData: false,
  
  // Relative URLs - proxied via vercel.json rewrites
  usuariosApiUrl: '/api/usuarios',
  estudiantesApiUrl: '/api/estudiantes',
  cursosApiUrl: '/api/cursos',
  evaluacionesApiUrl: '/api/evaluaciones',
  noticiasEventosApiUrl: '/api/noticias',
  docentesApiUrl: '/api/docentes',
  carrerasApiUrl: '/api/carreras',
  pedidosApiUrl: '/api/pedidos',
  systemSettingsApiUrl: '/api/system-settings',
  
  // Default API (for auth)
  apiUrl: '/api/usuarios',
  
  // Feature flags
  enableAnimations: true,
  logLevel: 'error' as const,
};
