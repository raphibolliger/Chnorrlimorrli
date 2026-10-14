import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteImage } from '../components/site-image';
import { texts } from '../content/texts';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SiteImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class Home {
  protected readonly texts = texts;
  protected readonly teasers = [
    {
      title: 'Orte erleben',
      text: '17 Schauplätze im Freiamt, die man mit Kindern selber entdecken kann.',
      image: 'orte/karte',
      path: '/orte',
    },
    {
      title: 'Über uns',
      text: 'Autor Stefan Sprenger, Zeichnerin «Etschgi» und die Freunde von Chnorrlimorrli.',
      image: 'ueber-uns/zeichnerin',
      path: '/ueber-uns',
    },
    {
      title: 'Song, Bänkli & mehr',
      text: 'Der Chnorrlimorrli-Rap, zwei Bänkli, ein eigenes Brot und eine Familienwanderung.',
      image: 'erleben/baenkli-villmergen',
      path: '/erleben',
    },
  ];
}
