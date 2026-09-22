import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DestinationGlyph, HeaderGlyph } from '../Glyphs';

describe('Glyphs', () => {
  it('labels destination tiles for semantic styling while hiding decoration', () => {
    // Arrange
    const { container } = render(<DestinationGlyph name="recently-deleted" />);

    // Assert
    expect(container.querySelector('[data-glyph="recently-deleted"]')).toHaveClass('psykl-glyph');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws different paths for the menu and close actions', () => {
    // Arrange
    const { container, rerender } = render(<HeaderGlyph name="menu" />);
    const menuPath = container.querySelector('path')?.getAttribute('d');

    // Act
    rerender(<HeaderGlyph name="close" />);

    // Assert
    expect(container.querySelector('path')).not.toHaveAttribute('d', menuPath);
  });
});
