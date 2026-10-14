import { slugify } from './product-admin-api';

describe('slugify', () => {
  it('turns product names into URL slugs', () => {
    expect(slugify('Chnorrlimorrli 2 – und die Könige des Freiamts')).toBe(
      'chnorrlimorrli-2-und-die-koenige-des-freiamts',
    );
    expect(slugify('  Freiämter Socken!  ')).toBe('freiaemter-socken');
  });
});
