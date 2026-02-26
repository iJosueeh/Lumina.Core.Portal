import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CookieService } from '@core/services/cookie.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const cookieService = inject(CookieService);
    
    // Intentar obtener el token de las cookies primero (método recomendado)
    let token = cookieService.get('auth_token');
    
    // Fallback a localStorage para compatibilidad con sesiones antiguas
    if (!token) {
        token = localStorage.getItem('token');
        
        // Si existe en localStorage, migrar a cookies
        if (token) {
            console.log('⚠️ [AUTH INTERCEPTOR] Migrando token de localStorage a cookies');
            cookieService.set('auth_token', token, {
                expires: 7, // 7 días
                path: '/',
                sameSite: 'Lax',
                secure: false // Cambiar a true en producción con HTTPS
            });
            // Opcionalmente, limpiar localStorage
            localStorage.removeItem('token');
        }
    }

    if (token) {
        console.log('✅ [AUTH INTERCEPTOR] Token encontrado, agregando a headers');
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    }

    console.log('⚠️ [AUTH INTERCEPTOR] No se encontró token en cookies ni localStorage');
    return next(req);
};
