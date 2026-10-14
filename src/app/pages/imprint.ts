import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OpenPoint } from '../components/open-point';
import { PageIntro } from '../components/page-intro';
import { contactEmail } from '../content/navigation';

@Component({
  selector: 'app-imprint',
  imports: [OpenPoint, PageIntro],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './imprint.html',
})
export class Imprint {
  protected readonly contactEmail = contactEmail;
}
