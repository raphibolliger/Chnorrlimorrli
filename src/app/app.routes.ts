import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
    title: 'Chnorrlimorrli – das Freiämter Kinderbuch',
    data: {
      description:
        'Halb Mensch, halb Monster und zu 100 Prozent ein Freiämter. Die Chnorrlimorrli-Bücher von Stefan Sprenger und Esther «Etschgi» Sorg.',
    },
  },
  {
    path: 'buecher',
    loadComponent: () => import('./pages/books').then((m) => m.Books),
    title: 'Die Bücher – Chnorrlimorrli',
    data: {
      description:
        'Wer und was isch de Chnorrlimorrli? Die beiden Freiämter Kinderbücher mit Mundartausdrücken, echten Schauplätzen und wichtigen Werten.',
    },
  },
  {
    path: 'orte',
    loadComponent: () => import('./pages/places').then((m) => m.Places),
    title: 'Die Orte erleben – Chnorrlimorrli',
    data: {
      description:
        '17 Schauplätze aus den Chnorrlimorrli-Büchern, die man im Freiamt selber besuchen kann.',
    },
  },
  {
    path: 'ueber-uns',
    loadComponent: () => import('./pages/about').then((m) => m.About),
    title: 'Über uns – Chnorrlimorrli',
    data: {
      description:
        'Autor Stefan Sprenger, Zeichnerin Esther «Etschgi» Sorg und die Freunde von Chnorrlimorrli.',
    },
  },
  {
    path: 'erleben',
    loadComponent: () => import('./pages/experiences').then((m) => m.Experiences),
    title: 'Song, Bänkli & mehr – Chnorrlimorrli',
    data: {
      description:
        'Der Chnorrlimorrli-Rap, die Chnorrlimorrli-Bänkli, das Chnorrlimorrli-Brot und die Familienwanderung.',
    },
  },
  {
    path: 'impressum',
    loadComponent: () => import('./pages/imprint').then((m) => m.Imprint),
    title: 'Impressum – Chnorrlimorrli',
  },
  {
    path: 'datenschutz',
    loadComponent: () => import('./pages/privacy').then((m) => m.Privacy),
    title: 'Datenschutzerklärung – Chnorrlimorrli',
  },
  {
    path: 'agb',
    loadComponent: () => import('./pages/terms').then((m) => m.Terms),
    title: 'AGB – Chnorrlimorrli',
  },
  {
    path: 'versand-und-zahlung',
    loadComponent: () => import('./pages/shipping-payment').then((m) => m.ShippingPayment),
    title: 'Versand und Zahlung – Chnorrlimorrli',
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop').then((m) => m.Shop),
    title: 'Shop – Chnorrlimorrli',
    data: {
      description:
        'Die Chnorrlimorrli-Bücher und Chnorrlimorrli-Socken online bestellen. Versand in die ganze Schweiz, Lieferung im Freiamt oder Abholung in Villmergen.',
    },
  },
  {
    path: 'shop/:slug',
    loadComponent: () => import('./pages/product').then((m) => m.ProductPage),
    title: 'Shop – Chnorrlimorrli',
  },
  {
    path: 'warenkorb',
    loadComponent: () => import('./pages/cart-page').then((m) => m.CartPage),
    title: 'Warenkorb – Chnorrlimorrli',
  },
  { path: 'products', redirectTo: 'shop' },
  { path: 'products/:legacyPath', redirectTo: 'shop' },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
    title: 'Seite nicht gefunden – Chnorrlimorrli',
  },
];
