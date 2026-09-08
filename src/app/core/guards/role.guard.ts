import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, SystemRole } from '@core/services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const expectedRole = route.data?.['role'] as SystemRole;
  const user = authService.getCurrentUser();

  if (!expectedRole || user?.role === expectedRole) {
    return true;
  }

  const roleDashboards: Record<string, string> = {
    STUDENT: '/student/dashboard',
    TEACHER: '/teacher/dashboard',
    ADMIN: '/admin/dashboard',
  };

  const target = user?.role ? roleDashboards[user.role] : '/login';
  return router.createUrlTree([target || '/login']);
};
