import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

@Component({
  selector: 'app-site-layout',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-layout.html',
})
export class SiteLayout {
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  protected skipToContent(): void {
    const content = this.content().nativeElement;
    content.focus({ preventScroll: true });
    content.scrollIntoView();
  }
}
