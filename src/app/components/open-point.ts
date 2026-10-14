import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-open-point',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './open-point.html',
})
export class OpenPoint {
  readonly text = input.required<string>();
}
