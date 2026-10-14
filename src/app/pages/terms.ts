import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OpenPoint } from '../components/open-point';
import { PageIntro } from '../components/page-intro';
import { contactEmail } from '../content/navigation';

@Component({
  selector: 'app-terms',
  imports: [RouterLink, OpenPoint, PageIntro],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terms.html',
})
export class Terms {
  protected readonly contactEmail = contactEmail;
}
