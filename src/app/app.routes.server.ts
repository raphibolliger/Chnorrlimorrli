import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'buecher', renderMode: RenderMode.Prerender },
  { path: 'orte', renderMode: RenderMode.Prerender },
  { path: 'ueber-uns', renderMode: RenderMode.Prerender },
  { path: 'erleben', renderMode: RenderMode.Prerender },
  { path: 'impressum', renderMode: RenderMode.Prerender },
  { path: 'datenschutz', renderMode: RenderMode.Prerender },
  { path: 'agb', renderMode: RenderMode.Prerender },
  { path: 'versand-und-zahlung', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
