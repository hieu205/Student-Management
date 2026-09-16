import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Cho phép đi tiếp nếu đã có token
  }

  // Chưa đăng nhập, tự động đá về trang login
  return router.parseUrl('/login');
};

