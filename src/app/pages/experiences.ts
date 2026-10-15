import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageIntro } from '../components/page-intro';
import { SiteImage } from '../components/site-image';
import { YoutubeEmbed } from '../components/youtube-embed';
import { downloads } from '../content/navigation';
import { texts } from '../content/texts';

@Component({
  selector: 'app-experiences',
  imports: [RouterLink, PageIntro, SiteImage, YoutubeEmbed],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experiences.html',
})
export class Experiences {
  protected readonly texts = texts;
  protected readonly songText = downloads[1];
  protected readonly sections = [
    { id: 'song', label: 'Song' },
    { id: 'baenkli', label: 'Bänkli' },
    { id: 'brot', label: 'Brot' },
    { id: 'wanderung', label: 'Wanderung' },
  ];
  protected readonly benches = [
    {
      title: 'Bänkli in Villmergen',
      image: 'erleben/baenkli-villmergen',
      alt: 'Chnorrlimorrli-Bänkli am Bullenberg in Villmergen',
      paragraphs: texts.benchVillmergen,
    },
    {
      title: 'Bänkli in Muri (Mittelpunkt des Freiamts)',
      image: 'erleben/baenkli-muri',
      alt: 'Luftaufnahme des Freiamts',
      paragraphs: texts.benchMuri,
    },
  ];
}
