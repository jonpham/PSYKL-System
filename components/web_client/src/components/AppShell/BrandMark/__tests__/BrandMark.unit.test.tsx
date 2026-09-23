import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BrandMark } from '../BrandMark';

describe('BrandMark', () => {
  it('draws the PSYKL mark as decoration beside the text it accompanies', () => {
    // Arrange
    const { container } = render(<BrandMark />);
    const svg = container.querySelector('svg');

    // Assert
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('psykl-brand-mark');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('inherits the surrounding text colour so it follows theme and contrast', () => {
    // Arrange
    const { container } = render(<BrandMark />);

    // Assert
    for (const path of container.querySelectorAll('path')) {
      expect(path).toHaveAttribute('fill', 'currentColor');
    }
  });
});
