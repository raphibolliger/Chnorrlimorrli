import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const defaultDescription =
  'Halb Mensch, halb Monster und zu 100 Prozent ein Freiämter. Das Freiämter Kinderbuch Chnorrlimorrli.';

@Injectable({ providedIn: 'root' })
export class PageMeta {
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  start(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.apply(this.router.routerState.snapshot.root));
  }

  private apply(root: ActivatedRouteSnapshot): void {
    let route = root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const description = (route.data['description'] as string | undefined) ?? defaultDescription;
    const title = this.document.title;
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
  }
}
