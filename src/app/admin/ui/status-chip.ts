import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from './icon';
import { Chip, chipToneClasses } from './tones';

@Component({
  selector: 'app-status-chip',
  imports: [Icon],
  host: {
    class:
      'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
    '[class]': 'toneClasses()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-chip.html',
})
export class StatusChip {
  readonly chip = input.required<Chip>();

  protected readonly toneClasses = computed(() => chipToneClasses[this.chip().tone]);
}
