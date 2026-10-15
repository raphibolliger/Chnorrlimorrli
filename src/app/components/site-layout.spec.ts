import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteLayout } from './site-layout';

describe('SiteLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders header with brand and footer with contact', async () => {
    const fixture = TestBed.createComponent(SiteLayout);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('header')?.textContent).toContain('Chnorrlimorrli');
    expect(element.querySelector('footer')?.textContent).toContain('hoi@chnorrlimorrli.ch');
  });
});
