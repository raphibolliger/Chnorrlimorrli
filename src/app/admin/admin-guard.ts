import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuth } from '../core/admin-auth';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuth);
  const router = inject(Router);
  await auth.ready();
  return auth.isAdmin() ? true : router.createUrlTree(['/admin/login']);
};
