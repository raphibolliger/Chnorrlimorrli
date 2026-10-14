import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageIntro } from '../components/page-intro';
import { SiteImage } from '../components/site-image';
import { downloads } from '../content/navigation';
import { texts } from '../content/texts';

@Component({
  selector: 'app-books',
  imports: [RouterLink, PageIntro, SiteImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './books.html',
})
export class Books {
  protected readonly texts = texts;
  protected readonly wordList = downloads[0];
  protected readonly books = [
    {
      title: 'Chnorrlimorrli',
      subtitle: 'Das erste Buch (2021)',
      image: 'buecher/buch-1',
      alt: 'Buchcover des ersten Chnorrlimorrli-Buchs',
      text: 'Vom Schisshase zum Helden: Chnorrlimorrli hat an sieben verschiedenen Orten im Freiamt jeweils eine Mission zu erfüllen. Die 1500 Exemplare der ersten Auflage sind beinahe vergriffen.',
    },
    {
      title: 'Chnorrlimorrli und die Könige des Freiamts',
      subtitle: 'Das zweite Buch (Dezember 2024)',
      image: 'buecher/buch-2',
      alt: 'Buchcover «Chnorrlimorrli und die Könige des Freiamts»',
      text: 'Die neuen Abenteuer von Chnorrlimorrli spielen an zehn verschiedenen Orten im Freiamt, die man alle auf eigene Faust besuchen kann.',
    },
  ];
}
