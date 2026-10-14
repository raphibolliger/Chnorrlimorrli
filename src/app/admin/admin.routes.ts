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
        path: 'bestellungen/:id',
        loadComponent: () => import('./order-detail').then((m) => m.AdminOrderDetail),
        title: 'Bestellung – Chnorrlimorrli Verwaltung',
      },
      {
        path: 'produkte',
        loadComponent: () => import('./products').then((m) => m.AdminProducts),
        title: 'Produkte – Chnorrlimorrli Verwaltung',
      },
      {
        path: 'produkte/:id',
        loadComponent: () => import('./product-edit').then((m) => m.AdminProductEdit),
        title: 'Produkt – Chnorrlimorrli Verwaltung',
      },
      {
        path: 'versand',
        loadComponent: () => import('./shipping').then((m) => m.AdminShipping),
        title: 'Versand – Chnorrlimorrli Verwaltung',
      },
    ],
  },
];
