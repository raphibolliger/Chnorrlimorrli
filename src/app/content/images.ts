export interface SiteImage {
  width: number;
  height: number;
  widths: number[];
}

export const siteImages: Record<string, SiteImage> = {
  logo: { width: 192, height: 192, widths: [96, 192] },
  'home/chnorrlimorrli': { width: 622, height: 744, widths: [360, 560, 622] },
  'buecher/chnorrlimorrli-und-freunde': { width: 1131, height: 1599, widths: [480, 960, 1131] },
  'orte/karte': { width: 1600, height: 2176, widths: [480, 960, 1600] },
  'orte/hasenbergturm': { width: 1000, height: 750, widths: [480, 1000] },
  'orte/strohmuseum': { width: 1000, height: 667, widths: [480, 1000] },
  'orte/surfwelle': { width: 1000, height: 667, widths: [480, 1000] },
  'orte/heidehuebelstein': { width: 1000, height: 750, widths: [480, 1000] },
  'orte/flachsee': { width: 1000, height: 667, widths: [480, 1000] },
  'orte/guggibad': { width: 1000, height: 664, widths: [480, 1000] },
  'orte/kloster-muri': { width: 1000, height: 720, widths: [480, 1000] },
  'orte/schloss-hallwyl': { width: 1200, height: 798, widths: [480, 960, 1200] },
  'orte/erdmannlistein': { width: 1000, height: 666, widths: [480, 1000] },
  'orte/feldenmoos': { width: 1000, height: 750, widths: [480, 1000] },
  'orte/niedermatten': { width: 1000, height: 667, widths: [480, 1000] },
  'orte/auw': { width: 1600, height: 1065, widths: [480, 960, 1600] },
  'orte/buenz': { width: 667, height: 1000, widths: [480, 667] },
  'orte/sandbank': { width: 1000, height: 792, widths: [480, 1000] },
  'orte/maiengruenturm': { width: 1000, height: 750, widths: [480, 1000] },
  'orte/soeriker-tobel': { width: 1000, height: 667, widths: [480, 1000] },
  'orte/murimoos': { width: 1000, height: 750, widths: [480, 1000] },
  'ueber-uns/autor': { width: 1600, height: 2240, widths: [480, 960, 1600] },
  'ueber-uns/zeichnerin': { width: 1600, height: 2240, widths: [480, 960, 1600] },
  'ueber-uns/making-of': { width: 500, height: 621, widths: [500] },
  'ueber-uns/brazzo': { width: 1200, height: 1600, widths: [480, 960, 1200] },
  'ueber-uns/madame-miau': { width: 1600, height: 1200, widths: [480, 960, 1600] },
  'erleben/baenkli-villmergen': { width: 1000, height: 750, widths: [480, 1000] },
  'erleben/baenkli-muri': { width: 1000, height: 753, widths: [480, 1000] },
  'erleben/brot': { width: 750, height: 1000, widths: [480, 750] },
  'erleben/wanderung': { width: 1600, height: 1067, widths: [480, 960, 1600, 1600] },
  'buecher/buch-1': { width: 382, height: 476, widths: [382] },
  'buecher/buch-1-rueckseite': { width: 382, height: 476, widths: [382] },
  'buecher/buch-2': { width: 600, height: 774, widths: [480, 600] },
};
