/**
 * AmbientBackground — Soft gradient blobs for the homepage.
 * Pure CSS, GPU-accelerated, pointer-events: none.
 */
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {/* Blob 1 — top-left, indigo */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 dark:opacity-15 animate-float-gentle blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
          animationDelay: '0s',
        }}
      />

      {/* Blob 2 — top-right, violet */}
      <div
        className="absolute -top-16 -right-24 w-80 h-80 rounded-full opacity-15 dark:opacity-10 animate-float-gentle blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
          animationDelay: '-5s',
          animationDuration: '18s',
        }}
      />

      {/* Blob 3 — center-bottom, cyan (light) / purple (dark) */}
      <div
        className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10 dark:opacity-8 animate-float-gentle blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)',
          animationDelay: '-10s',
          animationDuration: '20s',
        }}
      />

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
