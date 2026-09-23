import './brand-mark.css';

import { MARK_PATHS } from './markPaths';

/**
 * The PSYKL mark. Decorative by design — it always sits beside live "PSYKL"
 * text, so the accessible name belongs to the control that wraps it, not here.
 * Paths fill with `currentColor` so the mark follows theme and contrast
 * appearance without a variant per palette.
 */
function BrandMark() {
  return (
    <svg aria-hidden="true" className="psykl-brand-mark" viewBox="0 0 1024 1024">
      {MARK_PATHS.map((path) => (
        <path d={path} fill="currentColor" fillRule="evenodd" key={path} />
      ))}
    </svg>
  );
}

export { BrandMark };
