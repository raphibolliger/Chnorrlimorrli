import { siteImageUrl } from './site-image';

describe('siteImageUrl', () => {
  it('uses the requested width', () => {
    expect(siteImageUrl({ src: 'orte/flachsee', width: 480 })).toBe(
      'images/orte/flachsee-480.webp',
    );
  });

  it('falls back to the largest generated width', () => {
    expect(siteImageUrl({ src: 'logo' })).toBe('images/logo-192.webp');
  });
});
