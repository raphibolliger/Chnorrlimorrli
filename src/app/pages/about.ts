import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageIntro } from '../components/page-intro';
import { SiteImage } from '../components/site-image';
import { contactEmail } from '../content/navigation';
import { texts } from '../content/texts';
import { closingThanks, financialSupporters, supporters, thanksForHelp } from '../content/thanks';

@Component({
  selector: 'app-about',
  imports: [PageIntro, SiteImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.html',
})
export class About {
  protected readonly texts = texts;
  protected readonly contactEmail = contactEmail;
  protected readonly financialSupporters = financialSupporters;
  protected readonly thanksForHelp = thanksForHelp;
  protected readonly supporters = supporters;
  protected readonly closingThanks = closingThanks;
  protected readonly creators = [
    {
      title: 'Der Autor',
      name: 'Stefan Sprenger',
      image: 'ueber-uns/autor',
      paragraphs: texts.author,
      link: { label: 'www.stefansprenger.ch', url: 'https://stefansprenger.ch' },
    },
    {
      title: 'Die Zeichnerin',
      name: 'Esther «Etschgi» Sorg',
      image: 'ueber-uns/zeichnerin',
      paragraphs: texts.illustrator,
      link: { label: 'www.etschgi.ch', url: 'https://www.etschgi.ch' },
    },
  ];
  protected readonly friends = [
    {
      name: 'Brazzo',
      image: 'ueber-uns/brazzo',
      alt: 'Hund Brazzo im Wasser',
      paragraphs: texts.brazzo,
    },
    {
      name: 'Madame Miau',
      image: 'ueber-uns/madame-miau',
      alt: 'Katze Madame Miau auf Hausaufgaben',
      paragraphs: texts.madameMiau,
    },
  ];
}
