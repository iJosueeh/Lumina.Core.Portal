import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CookieService } from '@core/services/cookie.service';

let isRedirectingToLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const cookieService = inject(CookieService);
    const router = inject(Router);
    
    let token = cookieService.get('auth_token') || cookieService.get('AuthToken') || cookieService.get('AUTH_TOKEN');

    if (!token) {
        token = localStorage.getItem('token') || localStorage.getItem('auth_token');

        if (token) {
            console.log('⚠️ [AUTH INTERCEPTOR] Migrando token de localStorage a cookies');
            cookieService.set('auth_token', token, {
                expires: 7,
                path: '/',
                sameSite: 'Lax',
                secure: false
            });
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
        }
    }

    // Para peticiones al backend
    const isBackendRequest = req.url.includes('/api/') && !req.url.includes('/assets/');
    
    let reqToSend = req;
    if (token) {
        // Siempre usar Bearer token si existe (mock o real)
        console.log('✅ [AUTH INTERCEPTOR] Token encontrado, usando Authorization header');
        reqToSend = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    } else if (isBackendRequest) {
        // Si no hay token pero es backend, intentar con credentials (cookie httpOnly)
        console.log('🔐 [AUTH INTERCEPTOR] Sin token, intentando con withCredentials');
        reqToSend = req.clone({
            withCredentials: true
        });
    } else {
        console.log('⚠️ [AUTH INTERCEPTOR] No se encontró token en cookies ni localStorage');
    }

    return next(reqToSend).pipe(
        catchError(error => {
            if (error.status === 401 && !isRedirectingToLogin) {
                isRedirectingToLogin = true;
                console.warn('🔐 [AUTH INTERCEPTOR] Sesión expirada o token inválido. Redirigiendo al login...');
                cookieService.delete('auth_token', '/');
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                router.navigate(['/login']).then(() => {
                    isRedirectingToLogin = false;
                });
            }
            return throwError(() => error);
        })
    );
};
