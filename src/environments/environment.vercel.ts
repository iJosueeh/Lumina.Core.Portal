// Path: Lumina.Core.Portal/src/environments/environment.vercel.ts
/**
 * Environment configuration for Vercel deployment.
 * 
 * Uses /api as base — Vercel rewrites route to the correct Render service.
 * Service code appends /xxx/... (e.g. /api/cursos/system/all).
 */
export const environment = {
  production: true,
  useMockData: false,
  
  // Base API — Vercel rewrites route /api/xxx to the correct Render service
  usuariosApiUrl: '/api',
  estudiantesApiUrl: '/api',
  cursosApiUrl: '/api',
  evaluacionesApiUrl: '/api',
  noticiasEventosApiUrl: '/api',
  docentesApiUrl: '/api',
  carrerasApiUrl: '/api',
  pedidosApiUrl: '/api',
  
  // System Settings
  systemSettingsApiUrl: '/api/system-settings',
  
  // Default API (for auth)
  apiUrl: '/api',
  
  // Feature flags
  enableAnimations: true,
  logLevel: 'error' as const,
};
