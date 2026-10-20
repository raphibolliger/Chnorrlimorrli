import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';

let nextDialogId = 0;

@Component({
  selector: 'app-admin-dialog',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.html',
})
export class AdminDialog {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly dirty = input(false);
  readonly busy = input(false);
  readonly dismissed = output();

  protected readonly titleId = `admin-dialog-${nextDialogId++}`;
  protected readonly confirmingDiscard = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private pressedOnBackdrop = false;

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected requestClose(): void {
    if (this.busy()) {
      return;
    }
    if (this.dirty()) {
      this.confirmingDiscard.set(true);
      return;
    }
    this.dismissed.emit();
  }

  protected escape(event: Event): void {
    event.preventDefault();
    this.requestClose();
  }

  protected closedByBrowser(): void {
    if (this.busy() || this.dirty()) {
      this.dialog().nativeElement.showModal();
      this.confirmingDiscard.set(!this.busy());
      return;
    }
    this.dismissed.emit();
  }

  protected pressed(event: PointerEvent): void {
    this.pressedOnBackdrop = event.target === this.dialog().nativeElement;
  }

  protected clicked(event: MouseEvent): void {
    if (this.pressedOnBackdrop && event.target === this.dialog().nativeElement) {
      this.requestClose();
    }
    this.pressedOnBackdrop = false;
  }
}
