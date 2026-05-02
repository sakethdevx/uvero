/**
 * AmbientBackground — Soft gradient blobs for the homepage.
 * Pure CSS, GPU-accelerated, pointer-events: none.
 */
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-x-0 top-0 h-[42vh] opacity-45 dark:opacity-35 animate-ambient-sweep"
        style={{
          background:
            'linear-gradient(180deg, var(--ambient-indigo) 0%, var(--ambient-cyan) 52%, transparent 100%)',
          filter: 'blur(56px)',
        }}
      />

      {/* Primary ambient wash */}
      <div
        className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-35 dark:opacity-28 animate-ambient-drift blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--ambient-indigo) 0%, transparent 68%)',
          animationDelay: '0s',
          animationDuration: '20s',
        }}
      />

      {/* Secondary cool depth */}
      <div
        className="absolute bottom-[-22%] right-[-8rem] h-[30rem] w-[30rem] rounded-full opacity-22 dark:opacity-18 animate-ambient-drift blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--ambient-cyan) 0%, transparent 72%)',
          animationDelay: '-10s',
          animationDuration: '22s',
        }}
      />
    </div>
  );
}
