import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CookieService } from '@core/services/cookie.service';

let isRedirectingToLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const cookieService = inject(CookieService);
    const router = inject(Router);
    
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

    let reqToSend = req;
    if (token) {
        console.log('✅ [AUTH INTERCEPTOR] Token encontrado, agregando a headers');
        reqToSend = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    } else {
        console.log('⚠️ [AUTH INTERCEPTOR] No se encontró token en cookies ni localStorage');
    }

    return next(reqToSend).pipe(
        catchError(error => {
            if (error.status === 401 && !isRedirectingToLogin) {
                isRedirectingToLogin = true;
                console.warn('🔐 [AUTH INTERCEPTOR] Sesión expirada o token inválido. Redirigiendo al login...');
                // Limpiar credenciales almacenadas
                cookieService.delete('auth_token', '/');
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                // Redirigir al login
                router.navigate(['/login']).then(() => {
                    isRedirectingToLogin = false;
                });
            }
            return throwError(() => error);
        })
    );
};
