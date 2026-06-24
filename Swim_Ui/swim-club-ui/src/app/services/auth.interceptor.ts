import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 🌟 CONFIGURATION : On n'envoie PAS de jeton pour les routes de scraping et de data publiques
  if (req.url.includes('/api/scrape') || req.url.includes('/api/data')) {
    return next(req);
  }

  // Pour toutes les autres routes sécurisées (swimmers, seances, etc.)
  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
