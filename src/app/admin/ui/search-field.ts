import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-search-field',
  imports: [Icon],
  host: { class: 'relative block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-field.html',
})
export class SearchField {
  readonly placeholder = input.required<string>();
  readonly value = model.required<string>();
}
