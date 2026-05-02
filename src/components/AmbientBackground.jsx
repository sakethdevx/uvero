/**
 * AmbientBackground — Soft gradient mesh for the homepage.
 * Pure CSS, GPU-accelerated, pointer-events: none.
 */
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-x-0 top-0 h-[44vh] opacity-55 dark:opacity-42 animate-ambient-sweep"
        style={{
          background:
            'linear-gradient(180deg, var(--ambient-indigo) 0%, var(--ambient-cyan) 45%, var(--ambient-rose) 76%, transparent 100%)',
          filter: 'blur(64px)',
        }}
      />

      <div
        className="absolute inset-0 opacity-45 dark:opacity-32 animate-ambient-mesh"
        style={{
          background:
            'radial-gradient(circle at 18% 24%, var(--ambient-cyan) 0%, transparent 26%), radial-gradient(circle at 76% 18%, var(--ambient-indigo) 0%, transparent 28%), radial-gradient(circle at 48% 82%, var(--ambient-rose) 0%, transparent 32%)',
          filter: 'blur(54px)',
        }}
      />

      {/* Primary ambient wash */}
      <div
        className="absolute -top-44 left-[calc(50%-17rem)] h-[34rem] w-[34rem] rounded-full opacity-32 dark:opacity-26 animate-ambient-drift blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--ambient-indigo) 0%, transparent 68%)',
          animationDelay: '0s',
          animationDuration: '20s',
        }}
      />

      {/* Secondary cool depth */}
      <div
        className="absolute bottom-[-24%] right-[-8rem] h-[30rem] w-[30rem] rounded-full opacity-24 dark:opacity-18 animate-ambient-drift blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--ambient-cyan) 0%, transparent 72%)',
          animationDelay: '-10s',
          animationDuration: '22s',
        }}
      />

      {/* Tertiary warm counterpoint */}
      <div
        className="absolute bottom-[12%] left-[-10rem] h-[26rem] w-[26rem] rounded-full opacity-18 dark:opacity-14 animate-ambient-drift-reverse blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--ambient-rose) 0%, transparent 70%)',
          animationDelay: '-6s',
          animationDuration: '19s',
        }}
      />
    </div>
  );
}
