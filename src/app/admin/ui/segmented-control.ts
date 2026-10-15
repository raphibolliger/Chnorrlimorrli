import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface SegmentOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
  host: {
    role: 'group',
    class: 'flex max-w-full overflow-x-auto rounded-lg bg-gray-200/70 p-0.5 text-sm',
    '[attr.aria-label]': 'label()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './segmented-control.html',
})
export class SegmentedControl<T> {
  readonly options = input.required<readonly SegmentOption<T>[]>();
  readonly label = input.required<string>();
  readonly value = input<T>();
  readonly valueChange = output<T>();

  protected readonly items = computed(() =>
    this.options().map((option) => ({ ...option, selected: option.value === this.value() })),
  );
}
