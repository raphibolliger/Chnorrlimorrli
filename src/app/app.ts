import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from './components/site-footer';
import { SiteHeader } from './components/site-header';
import { PageMeta } from './core/page-meta';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
})
export class App {
  constructor() {
    inject(PageMeta).start();
  }
}
