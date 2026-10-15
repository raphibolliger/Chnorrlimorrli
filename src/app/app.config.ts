import { DOCUMENT, registerLocaleData, ViewportScroller } from '@angular/common';
import localeDeCh from '@angular/common/locales/de-CH';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { PageMeta } from './core/page-meta';

registerLocaleData(localeDeCh);

function offsetAnchorScrollingByScrollPadding(): void {
  const document = inject(DOCUMENT);
  inject(ViewportScroller).setOffset(() => [
    0,
    parseFloat(
      document.defaultView?.getComputedStyle(document.documentElement).scrollPaddingTop ?? '',
    ) || 0,
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideAppInitializer(offsetAnchorScrollingByScrollPadding),
    provideClientHydration(withEventReplay()),
    { provide: LOCALE_ID, useValue: 'de-CH' },
    { provide: TitleStrategy, useClass: PageMeta },
  ],
};
