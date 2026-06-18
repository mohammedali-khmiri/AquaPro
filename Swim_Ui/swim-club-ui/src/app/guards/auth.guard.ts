import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(r => auth.hasRole(r));
    if (!hasAccess) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
