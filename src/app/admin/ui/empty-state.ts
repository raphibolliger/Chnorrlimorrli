import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from './icon';
import { IconName, surfaceToneClasses, Tone } from './tones';

@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  host: { class: 'flex flex-col items-center gap-3 px-4 py-12 text-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly icon = input.required<IconName>();
  readonly message = input.required<string>();
  readonly tone = input<Tone>('neutral');

  protected readonly surfaceClasses = computed(() => surfaceToneClasses[this.tone()]);
}
