import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Protege las rutas /tabs/**: sin sesión redirige a Iniciar sesión. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.init();
  return auth.isLoggedIn() ? true : router.parseUrl('/auth/login');
};

/** Rutas públicas /auth/**: con sesión activa redirige a la pantalla de Tareas. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.init();
  return auth.isLoggedIn() ? router.parseUrl('/tabs/tasks') : true;
};
