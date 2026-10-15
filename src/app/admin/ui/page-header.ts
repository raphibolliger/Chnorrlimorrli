import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

@Component({
  selector: 'app-admin-page-header',
  imports: [RouterLink, Icon],
  host: {
    class:
      'sticky top-0 z-20 block border-b border-gray-200 bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 md:static md:border-0 md:bg-transparent md:px-0 md:pt-6 md:pb-4',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.html',
})
export class AdminPageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly backLink = input<string>();
}
