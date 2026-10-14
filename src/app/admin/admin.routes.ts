import { Routes } from '@angular/router';
import { adminGuard } from './admin-guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login').then((m) => m.AdminLogin),
    title: 'Anmelden – Chnorrlimorrli Verwaltung',
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'bestellungen' },
      {
        path: 'bestellungen',
        loadComponent: () => import('./orders').then((m) => m.AdminOrders),
        title: 'Bestellungen – Chnorrlimorrli Verwaltung',
      },
      {
        path: 'produkte',
        loadComponent: () => import('./products').then((m) => m.AdminProducts),
        title: 'Produkte – Chnorrlimorrli Verwaltung',
      },
      {
        path: 'versand',
        loadComponent: () => import('./shipping').then((m) => m.AdminShipping),
        title: 'Versand – Chnorrlimorrli Verwaltung',
      },
    ],
  },
];
