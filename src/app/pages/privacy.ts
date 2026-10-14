import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OpenPoint } from '../components/open-point';
import { PageIntro } from '../components/page-intro';
import { contactEmail } from '../content/navigation';

@Component({
  selector: 'app-privacy',
  imports: [OpenPoint, PageIntro],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.html',
})
export class Privacy {
  protected readonly contactEmail = contactEmail;
  protected readonly processors = [
    {
      name: 'GitHub Pages',
      company: 'GitHub Inc., USA',
      purpose:
        'Hosting dieser Webseite. Beim Aufruf werden technisch notwendige Daten wie IP-Adresse, Zeitpunkt und Browser kurzzeitig verarbeitet.',
    },
    {
      name: 'Supabase',
      company: 'Supabase Inc., USA; Datenhaltung in Zürich, Schweiz',
      purpose: 'Datenbank für Produkte, Bestellungen und das Login der Verwaltung.',
    },
    {
      name: 'Stripe',
      company: 'Stripe Payments Europe Ltd., Irland',
      purpose:
        'Abwicklung der Zahlung mit Karte, TWINT, Apple Pay und Google Pay. Zahlungsdaten werden direkt bei Stripe erfasst und nicht bei uns gespeichert.',
    },
    {
      name: 'Azure Communication Services',
      company: 'Microsoft Corporation, USA; Datenstandort USA',
      purpose: 'Versand der Bestellbestätigungen und Statusmitteilungen per E-Mail.',
    },
    {
      name: 'Plausible Analytics',
      company: 'Plausible Insights OÜ, Estland (EU)',
      purpose:
        'Anonyme Besucherstatistik ohne Cookies. Es werden keine personenbezogenen Daten gespeichert und keine Profile gebildet.',
    },
    {
      name: 'YouTube',
      company: 'Google Ireland Ltd., Irland',
      purpose:
        'Das Video zum Chnorrlimorrli-Song wird erst nach einem Klick über youtube-nocookie.com geladen. Erst dann werden Daten an YouTube übermittelt.',
    },
  ];
}
