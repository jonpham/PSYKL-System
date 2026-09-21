/** One glyph set for every destination and action in the experiment, drawn at a
 * single tile size (review note 1). Emoji and text arrows were inconsistent
 * across the shell and rendered far smaller than the surrounding controls. */

type GlyphName = 'list' | 'recently-deleted' | 'settings' | 'sync';

const PATHS: Record<GlyphName, string> = {
  list: 'M7 7h10M7 12h10M7 17h6',
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

export function ChevronGlyph() {
  return (
    <svg aria-hidden="true" className="reminders-chevron" viewBox="0 0 24 24">
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}
