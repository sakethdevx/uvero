/**
 * AmbientBackground — Soft, state-aware gradient mesh for the homepage.
 * Pure CSS, GPU-accelerated transforms, pointer-events: none.
 */
/**
 * AmbientBackground — Soft, state-aware gradient mesh for the homepage.
 * Pure CSS, GPU-accelerated transforms, pointer-events: none.
 */
export default function AmbientBackground({ state = 'idle', isHome = false }) {
  return (
    <div
      className="ambient-background fixed z-0 pointer-events-none overflow-hidden"
      style={{
        inset: '-100px', // Extend beyond viewport to cover iOS overscroll
      }}
      data-ambient-state={state}
      data-is-home={isHome}
      aria-hidden="true"
    >
      <div className="apple-aura" />
      <div className="ambient-grain" />
    </div>
  );
}
