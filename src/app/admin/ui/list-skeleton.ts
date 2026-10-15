import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-list-skeleton',
  host: { class: 'grid animate-pulse gap-2', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-skeleton.html',
})
export class ListSkeleton {
  readonly rows = input(5);
  readonly variant = input<'rows' | 'cards'>('cards');

  protected readonly rowIndexes = computed(() =>
    Array.from({ length: this.rows() }, (_, index) => index),
  );
}
