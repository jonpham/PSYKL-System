import './glyphs.css';

type DestinationGlyphName = 'list' | 'lists' | 'recently-deleted' | 'settings' | 'sync';

const PATHS: Record<DestinationGlyphName, string> = {
  list: 'M7 7h10M7 12h10M7 17h6',
  lists: 'M7 7h10M7 12h10M7 17h6',
  'recently-deleted': 'M12 7v5l3 2M4.5 12a7.5 7.5 0 1 0 2.2-5.3M6.7 3.5v3.2h3.2',
  settings: 'M4 9h16M4 15h16M15 6.5v5M9 12.5v5',
  sync: 'M4.5 12a7.5 7.5 0 0 1 12.8-5.3M19.5 12a7.5 7.5 0 0 1-12.8 5.3M17.3 3.5v3.2h-3.2M6.7 20.5v-3.2h3.2',
};

function DestinationGlyph({ name }: { name: DestinationGlyphName }) {
  return (
    <span aria-hidden="true" className="psykl-glyph" data-glyph={name}>
      <svg viewBox="0 0 24 24">
        <path d={PATHS[name]} />
      </svg>
    </span>
  );
}

function HeaderGlyph({ name }: { name: 'close' | 'menu' }) {
  return (
    <svg aria-hidden="true" className="psykl-header-glyph" viewBox="0 0 24 24">
      <path d={name === 'menu' ? 'M4 7h16M4 12h16M4 17h16' : 'M6 6l12 12M18 6L6 18'} />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg aria-hidden="true" className="psykl-plus-glyph" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg aria-hidden="true" className="psykl-chevron" viewBox="0 0 24 24">
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}

export { ChevronGlyph, DestinationGlyph, HeaderGlyph, PlusGlyph };
export type { DestinationGlyphName };
