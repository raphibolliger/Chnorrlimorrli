import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

const defaultDescription =
  'Halb Mensch, halb Monster und zu 100 Prozent ein Freiämter. Das Freiämter Kinderbuch Chnorrlimorrli.';

function deepestRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepestRoute(route.firstChild) : route;
}

@Injectable({ providedIn: 'root' })
export class PageMeta extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title !== undefined) {
      this.title.setTitle(title);
    }
    const description: string =
      deepestRoute(snapshot.root).data['description'] ?? defaultDescription;
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: this.title.getTitle() });
    this.meta.updateTag({ property: 'og:description', content: description });
  }
}
