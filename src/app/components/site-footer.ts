import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { contactEmail, downloads, legalNavigation, mainNavigation } from '../content/navigation';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-footer.html',
})
export class SiteFooter {
  protected readonly navigation = mainNavigation;
  protected readonly legal = legalNavigation;
  protected readonly downloads = downloads;
  protected readonly contactEmail = contactEmail;
  protected readonly year = new Date().getFullYear();
}
