import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { QueryClient, provideAngularQuery } from '@tanstack/angular-query-experimental';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Configuración del QueryClient con estrategias de caché
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran frescos (no se refetchean automáticamente)
      staleTime: 5 * 60 * 1000, // 5 minutos
      
      // Tiempo que los datos inactivos permanecen en caché
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
      
      // Reintentos en caso de error
      retry: 1,
      
      // Refetch cuando la ventana recupera el foco
      refetchOnWindowFocus: false,
      
      // Refetch cuando se reconecta a internet
      refetchOnReconnect: true,
      
      // Refetch cuando el componente se monta
      refetchOnMount: false,
    },
    mutations: {
      // Reintentos para mutaciones
      retry: 1,
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAngularQuery(queryClient),
  ],
};
