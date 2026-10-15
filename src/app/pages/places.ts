import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageIntro } from '../components/page-intro';
import { SiteImage } from '../components/site-image';
import { places } from '../content/places';
import { texts } from '../content/texts';

@Component({
  selector: 'app-places',
  imports: [RouterLink, PageIntro, SiteImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './places.html',
})
export class Places {
  protected readonly texts = texts;
  protected readonly books = [
    {
      id: 'buch-1',
      title: 'Die Orte aus Buch 1',
      intro: texts.placesBookOne,
      places: places.filter((place) => place.book === 1),
    },
    {
      id: 'buch-2',
      title: 'Die Orte aus Buch 2',
      intro: texts.placesBookTwo.slice(0, 1),
      places: places.filter((place) => place.book === 2),
    },
  ];
}
