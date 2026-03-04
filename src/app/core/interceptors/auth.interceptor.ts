import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { CookieService } from '@core/services/cookie.service';

let isRedirectingToLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const cookieService = inject(CookieService);
    const router = inject(Router);
    
    let token = cookieService.get('auth_token');
    
    if (!token) {
        token = localStorage.getItem('token');
        
        if (token) {
            console.log('⚠️ [AUTH INTERCEPTOR] Migrando token de localStorage a cookies');
            cookieService.set('auth_token', token, {
                expires: 7, // 7 días
                path: '/',
                sameSite: 'Lax',
                secure: false
            });
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
