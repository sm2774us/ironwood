import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResponsiveImage } from './ResponsiveImage';

const image = { _path: '/images/hero.svg', width: 1600, height: 900, alt: 'Skyline' };

describe('<ResponsiveImage />', () => {
  it('reserves intrinsic space to prevent layout shift', () => {
    render(<ResponsiveImage image={image} />);
    const img = screen.getByRole('img', { name: 'Skyline' });
    expect(img).toHaveAttribute('width', '1600');
    expect(img).toHaveAttribute('height', '900');
    expect(img).toHaveAttribute('loading', 'lazy');
  });
  it('prioritises the LCP candidate', () => {
    render(<ResponsiveImage image={image} priority />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });
});
