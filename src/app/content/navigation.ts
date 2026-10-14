export interface NavigationItem {
  label: string;
  path: string;
}

export const mainNavigation: NavigationItem[] = [
  { label: 'Die Bücher', path: '/buecher' },
  { label: 'Orte erleben', path: '/orte' },
  { label: 'Über uns', path: '/ueber-uns' },
  { label: 'Song, Bänkli & mehr', path: '/erleben' },
];

export const legalNavigation: NavigationItem[] = [
  { label: 'Impressum', path: '/impressum' },
  { label: 'Datenschutz', path: '/datenschutz' },
  { label: 'AGB', path: '/agb' },
  { label: 'Versand & Zahlung', path: '/versand-und-zahlung' },
];

export const contactEmail = 'hoi@chnorrlimorrli.ch';

export const downloads = [
  { label: 'Freiämter Wörtliliste (PDF)', file: 'downloads/freiaemter-woertliliste.pdf' },
  { label: 'Songtext Chnorrlimorrli-Rap (PDF)', file: 'downloads/chnorrlimorrli-songtext.pdf' },
];
