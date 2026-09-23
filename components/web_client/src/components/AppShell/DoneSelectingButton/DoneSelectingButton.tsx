interface DoneSelectingButtonProps {
  onClick: () => void;
}

/**
 * The way out of selection mode, in the slot the list menu usually holds.
 *
 * Filled rather than tinted: it is the only control in the header while the
 * mode is on, and it has to win against a list full of tappable rows.
 */
export function DoneSelectingButton({ onClick }: DoneSelectingButtonProps) {
  return (
    <button
      aria-label="Done selecting"
      className="psykl-app-shell__header-action"
      data-prominent="true"
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="20"
        stroke="currentcolor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </button>
  );
}
