export function ArtworkTile() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-2">
      {/* Artwork */}
      <img
        src="/images/event-artwork.png"
        alt="Minimal theme artwork"
        className="block aspect-square w-full rounded-xl object-cover"
      />

      {/* Small eye button bottom-right */}
      <button
        aria-label="Preview artwork"
        className="absolute bottom-4 right-4 grid size-9 place-items-center rounded-full bg-primary-foreground text-primary ring-1 ring-inset ring-border"
        title="Preview"
      >
        <div className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      </button>
    </div>
  )
}
