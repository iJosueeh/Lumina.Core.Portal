import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * 🚀 Estrategia de Precarga Personalizada
 * 
 * Precarga módulos de manera inteligente:
 * 1. Módulos críticos (dashboard) se precargan inmediatamente después del login
 * 2. Otros módulos se precargan con delay para no afectar la performance inicial
 * 3. Módulos no marcados como preload se cargan solo cuando se navega a ellos
 */
@Injectable({
  providedIn: 'root'
})
export class CustomPreloadStrategy implements PreloadingStrategy {
  
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Si la ruta no tiene data o preload es false, no precargar
    if (!route.data || route.data['preload'] !== true) {
      return of(null);
    }

    // Si la ruta tiene prioridad alta, precargar inmediatamente
    if (route.data['priority'] === 'high') {
      console.log(`⚡ Precargando inmediatamente: ${route.path}`);
      return load();
    }

    // Para otras rutas con preload, esperar 2 segundos antes de precargar
    // Esto da tiempo a que la aplicación termine de cargar
    const delay = route.data['delay'] || 2000;
    console.log(`⏱️ Precargando con delay de ${delay}ms: ${route.path}`);
    
    return timer(delay).pipe(
      mergeMap(() => {
        console.log(`✅ Iniciando precarga: ${route.path}`);
        return load();
      })
    );
  }
}

/**
 * 🎯 Configuración en app.config.ts:
 * 
 * import { provideRouter, withPreloading } from '@angular/router';
 * import { CustomPreloadStrategy } from './core/router/custom-preload-strategy';
 * import { routes } from './app.routes';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(
 *       routes,
 *       withPreloading(CustomPreloadStrategy)
 *     ),
 *     // ... otros providers
 *   ]
 * };
 * 
 * 
 * 📝 Uso en rutas:
 * 
 * {
 *   path: 'dashboard',
 *   loadComponent: () => import('...'),
 *   data: { 
 *     preload: true,           // ✅ Habilitar precarga
 *     priority: 'high',        // ⚡ Precarga inmediata
 *     delay: 1000              // ⏱️ Delay personalizado (opcional)
 *   }
 * }
 */
