import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the brand link', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const brand = (fixture.nativeElement as HTMLElement).querySelector('header a');
    expect(brand?.textContent).toContain('Chnorrlimorrli');
  });
});
