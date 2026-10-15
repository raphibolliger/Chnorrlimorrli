import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';
import { IconName } from './tones';

@Component({
  selector: 'app-section-card',
  imports: [Icon],
  host: { class: 'block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-card.html',
})
export class SectionCard {
  readonly title = input.required<string>();
  readonly icon = input.required<IconName>();
  readonly subtitle = input<string>();
}
