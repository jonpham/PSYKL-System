/** One glyph set for every destination and action in the experiment, drawn at a
 * single tile size (review note 1). Emoji and text arrows were inconsistent
 * across the shell and rendered far smaller than the surrounding controls. */

type GlyphName = 'list' | 'lists' | 'recently-deleted' | 'settings' | 'sync' | 'task';

const PATHS: Record<GlyphName, string> = {
  list: 'M7 7h10M7 12h10M7 17h6',
  lists: 'M7 7h10M7 12h10M7 17h6',
  task: 'M7.5 12l3 3 6-6',
  'recently-deleted': 'M12 7v5l3 2M4.5 12a7.5 7.5 0 1 0 2.2-5.3M6.7 3.5v3.2h3.2',
  settings: 'M4 9h16M4 15h16M15 6.5v5M9 12.5v5',
  sync: 'M4.5 12a7.5 7.5 0 0 1 12.8-5.3M19.5 12a7.5 7.5 0 0 1-12.8 5.3M17.3 3.5v3.2h-3.2M6.7 20.5v-3.2h3.2',
};

export function DestinationGlyph({ name }: { name: GlyphName }) {
  return (
    <span aria-hidden="true" className="reminders-glyph" data-glyph={name}>
      <svg viewBox="0 0 24 24">
        <path d={PATHS[name]} />
      </svg>
    </span>
  );
}

/** The shell header's leading glyph. Menu and close share one box so the PSYKL
 * wordmark starts at the same x whether the sidebar is open or shut. */
export function HeaderGlyph({ name }: { name: 'close' | 'menu' }) {
  return (
    <svg aria-hidden="true" className="reminders-header-glyph" viewBox="0 0 24 24">
      <path d={name === 'menu' ? 'M4 7h16M4 12h16M4 17h16' : 'M6 6l12 12M18 6L6 18'} />
    </svg>
  );
}

export function PlusGlyph() {
  return (
    <svg aria-hidden="true" className="reminders-plus-glyph" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronGlyph() {
  return (
    <svg aria-hidden="true" className="reminders-chevron" viewBox="0 0 24 24">
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}
