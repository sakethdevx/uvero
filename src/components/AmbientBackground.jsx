/**
 * AmbientBackground — Soft, state-aware gradient mesh for the homepage.
 * Pure CSS, GPU-accelerated transforms, pointer-events: none.
 */
export default function AmbientBackground({ state = 'idle' }) {
  return (
    <div
      className="ambient-background fixed inset-0 z-0 pointer-events-none overflow-hidden"
      data-ambient-state={state}
      aria-hidden="true"
    >
      <div className="apple-aura" />
    </div>
  );
}
